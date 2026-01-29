/**
 * AI Agent chat endpoint using Vercel AI SDK.
 *
 * POST /api/ai/chat    - SSE streaming chat endpoint
 * GET  /api/ai/sessions - List chat sessions for a project
 */

import { stepCountIs, streamText, tool } from "ai";
import { and, count, eq, ilike, inArray } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { z } from "zod";

import { dbPool } from "lib/db/db";
import {
  assignees,
  columns,
  labels,
  posts,
  projects,
  taskLabels,
  tasks,
  userOrganizations,
  users,
} from "lib/db/schema";
import { isWithinLimit } from "lib/entitlements/helpers";
import { isAgentEnabled } from "lib/flags";
import { authenticateRequest, validateProjectAccess } from "./auth";
import { resolveAgentConfig, resolvePersona } from "./config";
import { buildProjectContext } from "./prompts/projectContext";
import { buildSystemPrompt } from "./prompts/system";
import { createOpenRouterModel } from "./provider";
import { ORG_CHAT_LIMIT, USER_CHAT_LIMIT, checkRateLimit } from "./rateLimit";
import { modelMessageSchema } from "./schemas";
import {
  createSession,
  listSessions,
  loadSession,
  saveSessionMessages,
} from "./session/manager";
import { logActivity } from "./tools/server/activity";
import { createDelegationTool } from "./tools/server/delegation.tools";
import {
  getColumnTitles,
  getNextColumnIndex,
  resolveLabel,
  resolveTask,
  resolveTasks,
} from "./tools/server/helpers";
import { markdownToHtml } from "./tools/server/markdown";
import { requireProjectPermission } from "./tools/server/permissions";

import type { ModelMessage } from "ai";
import type { SelectAgentSession } from "lib/db/schema";
import type { AuthenticatedUser } from "./auth";
import type { WriteToolContext } from "./tools/server/context";
import type { DelegationContext } from "./tools/server/delegation.tools";

/**
 * AI Agent routes.
 *
 * POST /api/ai/chat    - SSE streaming chat endpoint
 * GET  /api/ai/sessions - List chat sessions for a project
 */
const aiRoutes = new Elysia({ prefix: "/api/ai" })
  .post(
    "/chat",
    async ({ request, body, set }) => {
      // Check feature flag
      const enabled = await isAgentEnabled();
      if (!enabled) {
        set.status = 403;
        return { error: "Agent feature is not enabled" };
      }

      // Authenticate
      let auth: AuthenticatedUser;
      try {
        auth = await authenticateRequest(request);
      } catch (err) {
        set.status = 401;
        return {
          error: err instanceof Error ? err.message : "Authentication failed",
        };
      }

      // Validate project access
      let projectAccess: { organizationId: string };
      try {
        projectAccess = await validateProjectAccess(
          body.projectId,
          auth.organizations,
        );
      } catch (err) {
        set.status = 403;
        return {
          error: err instanceof Error ? err.message : "Access denied",
        };
      }

      const { organizationId } = projectAccess;

      // Rate-limit: per-user and per-org
      const userLimit = checkRateLimit(`user:${auth.user.id}`, USER_CHAT_LIMIT);
      if (!userLimit.allowed) {
        set.status = 429;
        set.headers["Retry-After"] = String(userLimit.retryAfterSeconds);
        return { error: "Too many requests. Please try again later." };
      }

      const orgLimit = checkRateLimit(`org:${organizationId}`, ORG_CHAT_LIMIT);
      if (!orgLimit.allowed) {
        set.status = 429;
        set.headers["Retry-After"] = String(orgLimit.retryAfterSeconds);
        return {
          error: "Organization rate limit exceeded. Please try again later.",
        };
      }

      const requestStartTime = Date.now();

      // Resolve agent configuration
      const agentConfig = await resolveAgentConfig(organizationId);

      // Load or create session
      let session: SelectAgentSession;
      if (body.sessionId) {
        const loadedSession = await loadSession(
          body.sessionId,
          auth.user.id,
          body.projectId,
        );
        if (!loadedSession) {
          set.status = 404;
          return { error: "Session not found" };
        }
        session = loadedSession;
      } else {
        session = await createSession({
          organizationId,
          projectId: body.projectId,
          userId: auth.user.id,
        });
      }

      // Resolve persona: client-specified > org default > none
      const persona = body.personaId
        ? await resolvePersona(body.personaId, organizationId)
        : agentConfig.defaultPersona;

      // Build project context for system prompt
      const projectContext = await buildProjectContext({
        projectId: body.projectId,
        organizationId,
        userId: auth.user.id,
        userName: auth.user.name,
        customInstructions: agentConfig.customInstructions,
      });

      const systemPrompt = buildSystemPrompt(projectContext, persona);

      // Tool context for write operations
      const toolContext: WriteToolContext = {
        projectId: body.projectId,
        organizationId,
        userId: auth.user.id,
        accessToken: auth.accessToken,
        sessionId: session.id,
      };

      // Delegation context for persona delegation
      const delegationContext: DelegationContext = {
        ...toolContext,
        delegationDepth: 0,
        agentConfig,
        userName: auth.user.name,
      };

      // Create delegation tool (null if at max depth)
      const delegationTool = createDelegationTool(delegationContext);

      // Create model instance
      const model = createOpenRouterModel(
        agentConfig.model,
        agentConfig.orgApiKey,
      );

      // Convert messages to ModelMessage format
      const messages: ModelMessage[] = (body.messages as ModelMessage[]).filter(
        (m) => (m.role as string) !== "system",
      );

      // Structured request log
      const requestMeta = {
        userId: auth.user.id,
        projectId: body.projectId,
        sessionId: session.id,
        messageCount: messages.length,
        isNewSession: !body.sessionId,
      };

      // Define all tools inline using Vercel AI SDK pattern
      const aiTools = {
        // ─────────────────────────────────────────────
        // Query Tools (read-only)
        // ─────────────────────────────────────────────
        queryTasks: tool({
          description:
            "Search and filter tasks in the current project. Use this to find tasks by keyword, assignee, label, priority, column/status, or to list all tasks.",
          inputSchema: z.object({
            search: z
              .string()
              .optional()
              .describe("Search keyword to match against task titles"),
            columnId: z
              .string()
              .uuid()
              .optional()
              .describe("Filter by column/status ID"),
            priority: z
              .enum(["none", "low", "medium", "high", "urgent"])
              .optional()
              .describe("Filter by priority level"),
            assigneeId: z
              .string()
              .uuid()
              .optional()
              .describe("Filter by assignee user ID"),
            labelId: z
              .string()
              .uuid()
              .optional()
              .describe("Filter by label ID"),
            limit: z
              .number()
              .optional()
              .default(50)
              .describe("Maximum number of tasks to return"),
          }),
          execute: async (input) => {
            const conditions = [eq(tasks.projectId, toolContext.projectId)];

            if (input.search) {
              conditions.push(ilike(tasks.content, `%${input.search}%`));
            }
            if (input.columnId) {
              conditions.push(eq(tasks.columnId, input.columnId));
            }
            if (input.priority) {
              conditions.push(eq(tasks.priority, input.priority));
            }

            let taskRows = await dbPool
              .select({
                id: tasks.id,
                number: tasks.number,
                title: tasks.content,
                description: tasks.description,
                priority: tasks.priority,
                columnId: tasks.columnId,
                dueDate: tasks.dueDate,
                createdAt: tasks.createdAt,
              })
              .from(tasks)
              .where(and(...conditions))
              .limit(input.limit ?? 50)
              .orderBy(tasks.createdAt);

            if (input.assigneeId) {
              const assignedTaskIds = await dbPool
                .select({ taskId: assignees.taskId })
                .from(assignees)
                .where(eq(assignees.userId, input.assigneeId));
              const assignedIdSet = new Set(
                assignedTaskIds.map((a) => a.taskId),
              );
              taskRows = taskRows.filter((t) => assignedIdSet.has(t.id));
            }

            if (input.labelId) {
              const labeledTaskIds = await dbPool
                .select({ taskId: taskLabels.taskId })
                .from(taskLabels)
                .where(eq(taskLabels.labelId, input.labelId));
              const labeledIdSet = new Set(labeledTaskIds.map((l) => l.taskId));
              taskRows = taskRows.filter((t) => labeledIdSet.has(t.id));
            }

            const taskIds = taskRows.map((t) => t.id);

            const [taskAssignees, taskLabelRows, columnRows] =
              await Promise.all([
                taskIds.length > 0
                  ? dbPool
                      .select({
                        taskId: assignees.taskId,
                        userId: assignees.userId,
                        userName: users.name,
                      })
                      .from(assignees)
                      .innerJoin(users, eq(assignees.userId, users.id))
                      .where(inArray(assignees.taskId, taskIds))
                  : [],
                taskIds.length > 0
                  ? dbPool
                      .select({
                        taskId: taskLabels.taskId,
                        labelId: labels.id,
                        labelName: labels.name,
                        labelColor: labels.color,
                      })
                      .from(taskLabels)
                      .innerJoin(labels, eq(taskLabels.labelId, labels.id))
                      .where(inArray(taskLabels.taskId, taskIds))
                  : [],
                dbPool
                  .select({ id: columns.id, title: columns.title })
                  .from(columns)
                  .where(eq(columns.projectId, toolContext.projectId)),
              ]);

            const columnMap = new Map(columnRows.map((c) => [c.id, c.title]));
            const assigneeMap = new Map<
              string,
              Array<{ id: string; name: string }>
            >();
            for (const a of taskAssignees) {
              const existing = assigneeMap.get(a.taskId) ?? [];
              existing.push({ id: a.userId, name: a.userName });
              assigneeMap.set(a.taskId, existing);
            }
            const labelMap = new Map<
              string,
              Array<{ id: string; name: string; color: string }>
            >();
            for (const l of taskLabelRows) {
              const existing = labelMap.get(l.taskId) ?? [];
              existing.push({
                id: l.labelId,
                name: l.labelName,
                color: l.labelColor,
              });
              labelMap.set(l.taskId, existing);
            }

            return {
              tasks: taskRows.map((t) => ({
                id: t.id,
                number: t.number,
                title: t.title,
                description: t.description,
                priority: t.priority,
                columnId: t.columnId,
                columnTitle: columnMap.get(t.columnId) ?? "Unknown",
                dueDate: t.dueDate,
                assignees: assigneeMap.get(t.id) ?? [],
                labels: labelMap.get(t.id) ?? [],
                createdAt: t.createdAt,
              })),
              totalCount: taskRows.length,
            };
          },
        }),

        queryProject: tool({
          description:
            "Get details about the current project, including all columns (statuses), labels, and task counts per column.",
          inputSchema: z.object({
            includeTaskCounts: z
              .boolean()
              .optional()
              .default(true)
              .describe("Include task count per column"),
          }),
          execute: async (input) => {
            const project = await dbPool.query.projects.findFirst({
              where: eq(projects.id, toolContext.projectId),
              columns: {
                id: true,
                name: true,
                prefix: true,
                description: true,
              },
            });

            if (!project) {
              throw new Error(`Project ${toolContext.projectId} not found`);
            }

            const projectColumns = await dbPool
              .select({
                id: columns.id,
                title: columns.title,
                icon: columns.icon,
                index: columns.index,
              })
              .from(columns)
              .where(eq(columns.projectId, toolContext.projectId))
              .orderBy(columns.index);

            const projectLabels = await dbPool
              .select({
                id: labels.id,
                name: labels.name,
                color: labels.color,
                icon: labels.icon,
              })
              .from(labels)
              .where(eq(labels.projectId, toolContext.projectId));

            const orgLabels = await dbPool
              .select({
                id: labels.id,
                name: labels.name,
                color: labels.color,
                icon: labels.icon,
              })
              .from(labels)
              .where(eq(labels.organizationId, toolContext.organizationId));

            let columnsWithCounts = projectColumns.map((c) => ({
              ...c,
              taskCount: 0,
            }));
            let totalTasks = 0;

            if (input.includeTaskCounts !== false) {
              const taskCounts = await dbPool
                .select({ columnId: tasks.columnId, count: count() })
                .from(tasks)
                .where(eq(tasks.projectId, toolContext.projectId))
                .groupBy(tasks.columnId);

              const countMap = new Map(
                taskCounts.map((tc) => [tc.columnId, tc.count]),
              );
              columnsWithCounts = projectColumns.map((c) => ({
                ...c,
                taskCount: countMap.get(c.id) ?? 0,
              }));
              totalTasks = taskCounts.reduce((sum, tc) => sum + tc.count, 0);
            }

            return {
              project: {
                id: project.id,
                name: project.name,
                prefix: project.prefix,
                description: project.description,
                columns: columnsWithCounts,
                labels: [...projectLabels, ...orgLabels],
                totalTasks,
              },
            };
          },
        }),

        getTask: tool({
          description:
            "Get full details of a single task by its ID or task number.",
          inputSchema: z.object({
            taskId: z.string().uuid().optional().describe("Task UUID"),
            taskNumber: z
              .number()
              .optional()
              .describe("Task number (e.g., 42 for T-42)"),
          }),
          execute: async (input) => {
            if (!input.taskId && input.taskNumber === undefined) {
              return { task: null };
            }

            let taskRow: typeof tasks.$inferSelect | undefined;

            if (input.taskId) {
              taskRow = await dbPool.query.tasks.findFirst({
                where: and(
                  eq(tasks.id, input.taskId),
                  eq(tasks.projectId, toolContext.projectId),
                ),
              });
            } else if (input.taskNumber !== undefined) {
              taskRow = await dbPool.query.tasks.findFirst({
                where: and(
                  eq(tasks.number, input.taskNumber),
                  eq(tasks.projectId, toolContext.projectId),
                ),
              });
            }

            if (!taskRow) {
              return { task: null };
            }

            const [taskAssignees, taskLabelRows, column, commentCount] =
              await Promise.all([
                dbPool
                  .select({
                    userId: users.id,
                    userName: users.name,
                    userEmail: users.email,
                  })
                  .from(assignees)
                  .innerJoin(users, eq(assignees.userId, users.id))
                  .where(eq(assignees.taskId, taskRow.id)),
                dbPool
                  .select({
                    labelId: labels.id,
                    labelName: labels.name,
                    labelColor: labels.color,
                  })
                  .from(taskLabels)
                  .innerJoin(labels, eq(taskLabels.labelId, labels.id))
                  .where(eq(taskLabels.taskId, taskRow.id)),
                dbPool.query.columns.findFirst({
                  where: eq(columns.id, taskRow.columnId),
                  columns: { title: true },
                }),
                dbPool
                  .select({ count: count() })
                  .from(posts)
                  .where(eq(posts.taskId, taskRow.id))
                  .then((rows) => rows[0]?.count ?? 0),
              ]);

            return {
              task: {
                id: taskRow.id,
                number: taskRow.number,
                title: taskRow.content,
                description: taskRow.description,
                priority: taskRow.priority,
                columnId: taskRow.columnId,
                columnTitle: column?.title ?? "Unknown",
                dueDate: taskRow.dueDate,
                assignees: taskAssignees.map((a) => ({
                  id: a.userId,
                  name: a.userName,
                  email: a.userEmail,
                })),
                labels: taskLabelRows.map((l) => ({
                  id: l.labelId,
                  name: l.labelName,
                  color: l.labelColor,
                })),
                commentCount,
                createdAt: taskRow.createdAt,
                updatedAt: taskRow.updatedAt,
              },
            };
          },
        }),

        // ─────────────────────────────────────────────
        // Write Tools
        // ─────────────────────────────────────────────
        createTask: tool({
          description: "Create a new task in the current project.",
          inputSchema: z.object({
            title: z.string().describe("Task title"),
            columnId: z
              .string()
              .uuid()
              .describe("Column ID to place the task in"),
            description: z.string().optional().describe("Task description"),
            priority: z
              .enum(["none", "low", "medium", "high", "urgent"])
              .optional()
              .describe("Priority level"),
            dueDate: z
              .string()
              .datetime()
              .optional()
              .describe("Due date in ISO 8601 format"),
          }),
          needsApproval: agentConfig.requireApprovalForCreate,
          execute: async (input) => {
            await requireProjectPermission(toolContext, "editor");

            const taskCount = await dbPool
              .select({ count: count() })
              .from(tasks)
              .where(eq(tasks.projectId, toolContext.projectId))
              .then((rows) => rows[0]?.count ?? 0);

            const withinLimit = await isWithinLimit(
              { organizationId: toolContext.organizationId },
              "max_tasks",
              taskCount,
            );

            if (!withinLimit) {
              throw new Error("Task limit reached for your plan.");
            }

            const column = await dbPool.query.columns.findFirst({
              where: and(
                eq(columns.id, input.columnId),
                eq(columns.projectId, toolContext.projectId),
              ),
              columns: { id: true, title: true },
            });

            if (!column) {
              throw new Error(
                `Column ${input.columnId} not found in this project.`,
              );
            }

            const nextIndex = await getNextColumnIndex(input.columnId);
            const descriptionHtml = input.description
              ? markdownToHtml(input.description)
              : "";

            const [created] = await dbPool
              .insert(tasks)
              .values({
                content: input.title,
                description: descriptionHtml,
                priority: input.priority ?? "medium",
                columnId: input.columnId,
                columnIndex: nextIndex,
                projectId: toolContext.projectId,
                authorId: toolContext.userId,
                dueDate: input.dueDate ?? null,
              })
              .returning({
                id: tasks.id,
                number: tasks.number,
                title: tasks.content,
                columnId: tasks.columnId,
                priority: tasks.priority,
              });

            const result = {
              task: {
                id: created.id,
                number: created.number,
                title: created.title,
                columnId: created.columnId,
                columnTitle: column.title,
                priority: created.priority,
              },
            };

            logActivity({
              context: toolContext,
              toolName: "createTask",
              toolInput: input,
              toolOutput: result,
              status: "completed",
              affectedTaskIds: [created.id],
              snapshotBefore: {
                operation: "create",
                entityType: "task",
                entityId: created.id,
              },
            });

            return result;
          },
        }),

        updateTask: tool({
          description:
            "Update a task's title, description, priority, or due date.",
          inputSchema: z.object({
            taskId: z.string().uuid().optional().describe("Task UUID"),
            taskNumber: z.number().optional().describe("Task number"),
            title: z.string().optional().describe("New task title"),
            description: z.string().optional().describe("New task description"),
            priority: z
              .enum(["none", "low", "medium", "high", "urgent"])
              .optional()
              .describe("New priority level"),
            dueDate: z
              .string()
              .datetime()
              .nullable()
              .optional()
              .describe("New due date or null to clear"),
          }),
          execute: async (input) => {
            await requireProjectPermission(toolContext, "editor");
            const task = await resolveTask(input, toolContext.projectId);

            const patch: Record<string, unknown> = {};
            if (input.title !== undefined) patch.content = input.title;
            if (input.description !== undefined)
              patch.description = markdownToHtml(input.description);
            if (input.priority !== undefined) patch.priority = input.priority;
            if (input.dueDate !== undefined) patch.dueDate = input.dueDate;

            if (Object.keys(patch).length === 0) {
              throw new Error("No fields to update.");
            }

            const [updated] = await dbPool
              .update(tasks)
              .set(patch)
              .where(eq(tasks.id, task.id))
              .returning({
                id: tasks.id,
                number: tasks.number,
                title: tasks.content,
                priority: tasks.priority,
                dueDate: tasks.dueDate,
              });

            const result = {
              task: {
                id: updated.id,
                number: updated.number,
                title: updated.title,
                priority: updated.priority,
                dueDate: updated.dueDate,
              },
            };

            logActivity({
              context: toolContext,
              toolName: "updateTask",
              toolInput: input,
              toolOutput: result,
              status: "completed",
              affectedTaskIds: [task.id],
              snapshotBefore: {
                operation: "update",
                entityType: "task",
                entityId: task.id,
                previousState: {
                  content: task.content,
                  description: task.description,
                  priority: task.priority,
                  dueDate: task.dueDate,
                },
              },
            });

            return result;
          },
        }),

        moveTask: tool({
          description: "Move a task to a different column (status).",
          inputSchema: z.object({
            taskId: z.string().uuid().optional().describe("Task UUID"),
            taskNumber: z.number().optional().describe("Task number"),
            columnId: z.string().uuid().describe("Target column ID"),
          }),
          execute: async (input) => {
            await requireProjectPermission(toolContext, "editor");
            const task = await resolveTask(input, toolContext.projectId);

            const targetColumn = await dbPool.query.columns.findFirst({
              where: and(
                eq(columns.id, input.columnId),
                eq(columns.projectId, toolContext.projectId),
              ),
              columns: { id: true, title: true },
            });

            if (!targetColumn) {
              throw new Error(
                `Column ${input.columnId} not found in this project.`,
              );
            }

            const sourceColumn = await dbPool.query.columns.findFirst({
              where: eq(columns.id, task.columnId),
              columns: { title: true },
            });

            const nextIndex = await getNextColumnIndex(input.columnId);

            await dbPool
              .update(tasks)
              .set({ columnId: input.columnId, columnIndex: nextIndex })
              .where(eq(tasks.id, task.id));

            const result = {
              task: { id: task.id, number: task.number, title: task.content },
              fromColumn: sourceColumn?.title ?? "Unknown",
              toColumn: targetColumn.title,
            };

            logActivity({
              context: toolContext,
              toolName: "moveTask",
              toolInput: input,
              toolOutput: result,
              status: "completed",
              affectedTaskIds: [task.id],
              snapshotBefore: {
                operation: "move",
                entityType: "task",
                entityId: task.id,
                previousState: {
                  columnId: task.columnId,
                  columnIndex: task.columnIndex,
                },
              },
            });

            return result;
          },
        }),

        assignTask: tool({
          description: "Add or remove an assignee on a task.",
          inputSchema: z.object({
            taskId: z.string().uuid().optional().describe("Task UUID"),
            taskNumber: z.number().optional().describe("Task number"),
            userId: z.string().uuid().describe("User ID to assign or unassign"),
            action: z
              .enum(["add", "remove"])
              .describe("Whether to add or remove the assignee"),
          }),
          execute: async (input) => {
            await requireProjectPermission(toolContext, "member");
            const task = await resolveTask(input, toolContext.projectId);

            const membership = await dbPool.query.userOrganizations.findFirst({
              where: and(
                eq(userOrganizations.userId, input.userId),
                eq(
                  userOrganizations.organizationId,
                  toolContext.organizationId,
                ),
              ),
            });

            if (!membership) {
              throw new Error(
                `User ${input.userId} is not a member of this organization.`,
              );
            }

            const user = await dbPool.query.users.findFirst({
              where: eq(users.id, input.userId),
              columns: { name: true },
            });

            if (!user) {
              throw new Error(`User ${input.userId} not found.`);
            }

            if (input.action === "add") {
              const assigneeCount = await dbPool
                .select({ count: count() })
                .from(assignees)
                .where(eq(assignees.taskId, task.id))
                .then((rows) => rows[0]?.count ?? 0);

              const withinLimit = await isWithinLimit(
                { organizationId: toolContext.organizationId },
                "max_assignees",
                assigneeCount,
              );
              if (!withinLimit) {
                throw new Error("Assignee limit reached for your plan.");
              }

              await dbPool
                .insert(assignees)
                .values({ taskId: task.id, userId: input.userId })
                .onConflictDoNothing();
            } else {
              await dbPool
                .delete(assignees)
                .where(
                  and(
                    eq(assignees.taskId, task.id),
                    eq(assignees.userId, input.userId),
                  ),
                );
            }

            const result = {
              taskId: task.id,
              taskNumber: task.number,
              taskTitle: task.content,
              userId: input.userId,
              userName: user.name,
              action: input.action,
            };

            logActivity({
              context: toolContext,
              toolName: "assignTask",
              toolInput: input,
              toolOutput: result,
              status: "completed",
              affectedTaskIds: [task.id],
              snapshotBefore: {
                operation: input.action === "add" ? "assign" : "unassign",
                entityType: "assignee",
                entityId: task.id,
                previousState: { taskId: task.id, userId: input.userId },
              },
            });

            return result;
          },
        }),

        addLabel: tool({
          description: "Add a label to a task by ID or name.",
          inputSchema: z.object({
            taskId: z.string().uuid().optional().describe("Task UUID"),
            taskNumber: z.number().optional().describe("Task number"),
            labelId: z.string().uuid().optional().describe("Label ID"),
            labelName: z.string().optional().describe("Label name"),
            createIfMissing: z
              .boolean()
              .optional()
              .default(false)
              .describe("Create label if not found"),
            labelColor: z
              .string()
              .optional()
              .default("blue")
              .describe("Color for new label"),
          }),
          execute: async (input) => {
            await requireProjectPermission(toolContext, "member");

            if (!input.labelId && !input.labelName) {
              throw new Error("Either labelId or labelName must be provided.");
            }

            const task = await resolveTask(input, toolContext.projectId);
            let label: { id: string; name: string };
            let labelCreated = false;

            if (input.labelId) {
              label = await resolveLabel(
                input.labelId,
                toolContext.projectId,
                toolContext.organizationId,
              );
            } else {
              const labelName = input.labelName!.trim();

              let existingLabel = await dbPool.query.labels.findFirst({
                where: and(
                  eq(labels.projectId, toolContext.projectId),
                  eq(labels.name, labelName),
                ),
                columns: { id: true, name: true },
              });

              if (!existingLabel) {
                existingLabel = await dbPool.query.labels.findFirst({
                  where: and(
                    eq(labels.organizationId, toolContext.organizationId),
                    eq(labels.name, labelName),
                  ),
                  columns: { id: true, name: true },
                });
              }

              if (existingLabel) {
                label = existingLabel;
              } else if (input.createIfMissing) {
                const [newLabel] = await dbPool
                  .insert(labels)
                  .values({
                    name: labelName,
                    color: input.labelColor ?? "blue",
                    projectId: toolContext.projectId,
                  })
                  .returning({ id: labels.id, name: labels.name });
                label = newLabel;
                labelCreated = true;
              } else {
                throw new Error(`Label "${labelName}" not found.`);
              }
            }

            await dbPool
              .insert(taskLabels)
              .values({ taskId: task.id, labelId: label.id })
              .onConflictDoNothing();

            const result = {
              taskId: task.id,
              taskNumber: task.number,
              taskTitle: task.content,
              labelId: label.id,
              labelName: label.name,
              labelCreated,
            };

            logActivity({
              context: toolContext,
              toolName: "addLabel",
              toolInput: input,
              toolOutput: result,
              status: "completed",
              affectedTaskIds: [task.id],
              snapshotBefore: {
                operation: "addLabel",
                entityType: "taskLabel",
                entityId: task.id,
                previousState: { taskId: task.id, labelId: label.id },
              },
            });

            return result;
          },
        }),

        removeLabel: tool({
          description: "Remove a label from a task.",
          inputSchema: z.object({
            taskId: z.string().uuid().optional().describe("Task UUID"),
            taskNumber: z.number().optional().describe("Task number"),
            labelId: z.string().uuid().describe("Label ID to remove"),
          }),
          execute: async (input) => {
            await requireProjectPermission(toolContext, "member");
            const task = await resolveTask(input, toolContext.projectId);
            const label = await resolveLabel(
              input.labelId,
              toolContext.projectId,
              toolContext.organizationId,
            );

            await dbPool
              .delete(taskLabels)
              .where(
                and(
                  eq(taskLabels.taskId, task.id),
                  eq(taskLabels.labelId, input.labelId),
                ),
              );

            const result = {
              taskId: task.id,
              taskNumber: task.number,
              taskTitle: task.content,
              labelId: label.id,
              labelName: label.name,
            };

            logActivity({
              context: toolContext,
              toolName: "removeLabel",
              toolInput: input,
              toolOutput: result,
              status: "completed",
              affectedTaskIds: [task.id],
              snapshotBefore: {
                operation: "removeLabel",
                entityType: "taskLabel",
                entityId: task.id,
                previousState: { taskId: task.id, labelId: label.id },
              },
            });

            return result;
          },
        }),

        addComment: tool({
          description: "Add a comment to a task.",
          inputSchema: z.object({
            taskId: z.string().uuid().optional().describe("Task UUID"),
            taskNumber: z.number().optional().describe("Task number"),
            content: z.string().describe("Comment text"),
          }),
          execute: async (input) => {
            await requireProjectPermission(toolContext, "member");
            const task = await resolveTask(input, toolContext.projectId);

            const [comment] = await dbPool
              .insert(posts)
              .values({
                description: input.content,
                authorId: toolContext.userId,
                taskId: task.id,
              })
              .returning({ id: posts.id });

            const result = {
              commentId: comment.id,
              taskId: task.id,
              taskNumber: task.number,
              taskTitle: task.content,
            };

            logActivity({
              context: toolContext,
              toolName: "addComment",
              toolInput: input,
              toolOutput: result,
              status: "completed",
              affectedTaskIds: [task.id],
              snapshotBefore: {
                operation: "addComment",
                entityType: "comment",
                entityId: comment.id,
              },
            });

            return result;
          },
        }),

        // ─────────────────────────────────────────────
        // Destructive Tools (require approval)
        // ─────────────────────────────────────────────
        deleteTask: tool({
          description: "Permanently delete a task. This cannot be undone.",
          inputSchema: z.object({
            taskId: z.string().uuid().optional().describe("Task UUID"),
            taskNumber: z.number().optional().describe("Task number"),
          }),
          needsApproval: agentConfig.requireApprovalForDestructive,
          execute: async (input) => {
            await requireProjectPermission(toolContext, "editor");
            const task = await resolveTask(input, toolContext.projectId);

            await dbPool.delete(tasks).where(eq(tasks.id, task.id));

            const result = {
              deletedTaskId: task.id,
              deletedTaskNumber: task.number,
              deletedTaskTitle: task.content,
            };

            logActivity({
              context: toolContext,
              toolName: "deleteTask",
              toolInput: input,
              toolOutput: result,
              status: "completed",
              requiresApproval: agentConfig.requireApprovalForDestructive,
              affectedTaskIds: [task.id],
              snapshotBefore: {
                operation: "delete",
                entityType: "task",
                entityId: task.id,
                previousState: {
                  content: task.content,
                  description: task.description,
                  priority: task.priority,
                  columnId: task.columnId,
                  columnIndex: task.columnIndex,
                  dueDate: task.dueDate,
                  authorId: task.authorId,
                },
              },
            });

            return result;
          },
        }),

        batchMoveTasks: tool({
          description:
            "Move multiple tasks to a target column in one operation.",
          inputSchema: z.object({
            tasks: z
              .array(
                z.object({
                  taskId: z.string().uuid().optional(),
                  taskNumber: z.number().optional(),
                }),
              )
              .min(1)
              .max(50)
              .describe("Tasks to move (1-50)"),
            columnId: z.string().uuid().describe("Target column ID"),
          }),
          needsApproval: agentConfig.requireApprovalForDestructive,
          execute: async (input) => {
            await requireProjectPermission(toolContext, "editor");

            const resolvedTasks = await resolveTasks(
              input.tasks,
              toolContext.projectId,
            );
            const sourceColumnIds = resolvedTasks.map((t) => t.columnId);
            const columnTitleMap = await getColumnTitles(sourceColumnIds);

            const result = await dbPool.transaction(async (tx) => {
              const targetColumn = await tx.query.columns.findFirst({
                where: and(
                  eq(columns.id, input.columnId),
                  eq(columns.projectId, toolContext.projectId),
                ),
                columns: { id: true, title: true },
              });

              if (!targetColumn) {
                throw new Error(
                  `Column ${input.columnId} not found in this project.`,
                );
              }

              const movedTasks: Array<{
                id: string;
                number: number | null;
                title: string;
                fromColumn: string;
              }> = [];
              const affectedIds: string[] = [];
              let nextIndex = await getNextColumnIndex(input.columnId);

              for (const task of resolvedTasks) {
                await tx
                  .update(tasks)
                  .set({ columnId: input.columnId, columnIndex: nextIndex })
                  .where(eq(tasks.id, task.id));
                nextIndex++;
                movedTasks.push({
                  id: task.id,
                  number: task.number,
                  title: task.content,
                  fromColumn: columnTitleMap.get(task.columnId) ?? "Unknown",
                });
                affectedIds.push(task.id);
              }

              return {
                movedCount: movedTasks.length,
                targetColumn: targetColumn.title,
                movedTasks,
                errors: [],
                affectedIds,
              };
            });

            logActivity({
              context: toolContext,
              toolName: "batchMoveTasks",
              toolInput: input,
              toolOutput: result,
              status: "completed",
              requiresApproval: agentConfig.requireApprovalForDestructive,
              affectedTaskIds: result.affectedIds,
              snapshotBefore: {
                operation: "batchMove",
                entityType: "task",
                tasks: resolvedTasks.map((t) => ({
                  taskId: t.id,
                  columnId: t.columnId,
                  columnIndex: t.columnIndex,
                })),
              },
            });

            return {
              movedCount: result.movedCount,
              targetColumn: result.targetColumn,
              movedTasks: result.movedTasks,
              errors: result.errors,
            };
          },
        }),

        batchUpdateTasks: tool({
          description: "Update fields on multiple tasks at once.",
          inputSchema: z.object({
            tasks: z
              .array(
                z.object({
                  taskId: z.string().uuid().optional(),
                  taskNumber: z.number().optional(),
                }),
              )
              .min(1)
              .max(50)
              .describe("Tasks to update (1-50)"),
            priority: z
              .enum(["none", "low", "medium", "high", "urgent"])
              .optional()
              .describe("New priority for all tasks"),
            dueDate: z
              .string()
              .datetime()
              .nullable()
              .optional()
              .describe("New due date for all tasks"),
          }),
          needsApproval: agentConfig.requireApprovalForDestructive,
          execute: async (input) => {
            await requireProjectPermission(toolContext, "editor");

            const patch: Record<string, unknown> = {};
            if (input.priority !== undefined) patch.priority = input.priority;
            if (input.dueDate !== undefined) patch.dueDate = input.dueDate;

            if (Object.keys(patch).length === 0) {
              throw new Error("No fields to update.");
            }

            const resolvedTasks = await resolveTasks(
              input.tasks,
              toolContext.projectId,
            );

            const result = await dbPool.transaction(async (tx) => {
              const updatedTasks: Array<{
                id: string;
                number: number | null;
                title: string;
              }> = [];
              const affectedIds: string[] = [];

              for (const task of resolvedTasks) {
                await tx.update(tasks).set(patch).where(eq(tasks.id, task.id));
                updatedTasks.push({
                  id: task.id,
                  number: task.number,
                  title: task.content,
                });
                affectedIds.push(task.id);
              }

              return {
                updatedCount: updatedTasks.length,
                updatedTasks,
                errors: [],
                affectedIds,
              };
            });

            logActivity({
              context: toolContext,
              toolName: "batchUpdateTasks",
              toolInput: input,
              toolOutput: result,
              status: "completed",
              requiresApproval: agentConfig.requireApprovalForDestructive,
              affectedTaskIds: result.affectedIds,
              snapshotBefore: {
                operation: "batchUpdate",
                entityType: "task",
                tasks: resolvedTasks.map((t) => ({
                  taskId: t.id,
                  priority: t.priority,
                  dueDate: t.dueDate,
                })),
              },
            });

            return {
              updatedCount: result.updatedCount,
              updatedTasks: result.updatedTasks,
              errors: result.errors,
            };
          },
        }),

        batchDeleteTasks: tool({
          description:
            "Permanently delete multiple tasks. This cannot be undone.",
          inputSchema: z.object({
            tasks: z
              .array(
                z.object({
                  taskId: z.string().uuid().optional(),
                  taskNumber: z.number().optional(),
                }),
              )
              .min(1)
              .max(50)
              .describe("Tasks to delete (1-50)"),
          }),
          needsApproval: agentConfig.requireApprovalForDestructive,
          execute: async (input) => {
            await requireProjectPermission(toolContext, "editor");

            const resolvedTasks = await resolveTasks(
              input.tasks,
              toolContext.projectId,
            );

            const result = await dbPool.transaction(async (tx) => {
              const deletedTasks: Array<{
                id: string;
                number: number | null;
                title: string;
              }> = [];
              const affectedIds: string[] = [];

              for (const task of resolvedTasks) {
                await tx.delete(tasks).where(eq(tasks.id, task.id));
                deletedTasks.push({
                  id: task.id,
                  number: task.number,
                  title: task.content,
                });
                affectedIds.push(task.id);
              }

              return {
                deletedCount: deletedTasks.length,
                deletedTasks,
                errors: [],
                affectedIds,
              };
            });

            logActivity({
              context: toolContext,
              toolName: "batchDeleteTasks",
              toolInput: input,
              toolOutput: result,
              status: "completed",
              requiresApproval: agentConfig.requireApprovalForDestructive,
              affectedTaskIds: result.affectedIds,
              snapshotBefore: {
                operation: "batchDelete",
                entityType: "task",
                tasks: resolvedTasks.map((t) => ({
                  taskId: t.id,
                  content: t.content,
                  description: t.description,
                  priority: t.priority,
                  columnId: t.columnId,
                  columnIndex: t.columnIndex,
                  dueDate: t.dueDate,
                  authorId: t.authorId,
                })),
              },
            });

            return {
              deletedCount: result.deletedCount,
              deletedTasks: result.deletedTasks,
              errors: result.errors,
            };
          },
        }),

        // ─────────────────────────────────────────────
        // Delegation Tool (if not at max depth)
        // ─────────────────────────────────────────────
        ...(delegationTool ? { delegateToAgent: delegationTool } : {}),
      };

      // Track for persistence
      const baseToolCallCount = session.toolCallCount;

      // Create streaming response with Vercel AI SDK
      const result = streamText({
        model,
        messages,
        tools: aiTools,
        system: systemPrompt,
        stopWhen: stepCountIs(agentConfig.maxIterations),
        onFinish: async (finalResult) => {
          const durationMs = Date.now() - requestStartTime;
          const newToolCallCount = finalResult.toolCalls?.length ?? 0;

          // Build messages for persistence
          const finalMessages = [...messages, ...finalResult.response.messages];

          await saveSessionMessages(session.id, finalMessages, {
            toolCalls: baseToolCallCount + newToolCallCount,
          }).catch((err) => {
            console.error("[AI] Failed to save session messages:", {
              ...requestMeta,
              error: err instanceof Error ? err.message : String(err),
              durationMs,
            });
          });

          console.info("[AI] Chat completed:", {
            ...requestMeta,
            toolCallCount: newToolCallCount,
            durationMs,
          });
        },
      });

      // Create response with custom headers
      const response = result.toUIMessageStreamResponse();

      // Add session ID header
      const headers = new Headers(response.headers);
      headers.set("X-Agent-Session-Id", session.id);
      headers.set("Access-Control-Expose-Headers", "X-Agent-Session-Id");

      return new Response(response.body, {
        status: response.status,
        headers,
      });
    },
    {
      body: t.Object({
        projectId: t.String(),
        sessionId: t.Optional(t.String()),
        personaId: t.Optional(t.String()),
        messages: t.Array(modelMessageSchema),
      }),
    },
  )
  .get(
    "/sessions",
    async ({ request, query, set }) => {
      // Check feature flag
      const enabled = await isAgentEnabled();
      if (!enabled) {
        set.status = 403;
        return { error: "Agent feature is not enabled" };
      }

      // Authenticate
      let auth: AuthenticatedUser;
      try {
        auth = await authenticateRequest(request);
      } catch (err) {
        set.status = 401;
        return {
          error: err instanceof Error ? err.message : "Authentication failed",
        };
      }

      // Validate project access
      try {
        await validateProjectAccess(query.projectId, auth.organizations);
      } catch (err) {
        set.status = 403;
        return {
          error: err instanceof Error ? err.message : "Access denied",
        };
      }

      const sessions = await listSessions(query.projectId, auth.user.id);
      return { sessions };
    },
    {
      query: t.Object({
        projectId: t.String(),
      }),
    },
  );

export default aiRoutes;
