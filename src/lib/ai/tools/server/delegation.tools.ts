/**
 * Agent-to-Agent delegation tool.
 *
 * Allows one agent persona to delegate a subtask to another persona.
 * The delegate runs a full generateText loop with query + write tools
 * and returns its text response. Delegation depth is capped at 2.
 *
 * Security constraints:
 * - Delegates do NOT receive destructive/approval-gated tools
 * - Sub-agent execution has a wall-clock timeout
 * - Instruction is wrapped in structured framing
 * - Response length is capped
 */

import { generateText, stepCountIs, tool } from "ai";
import { and, count, eq, ilike } from "drizzle-orm";
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
import { resolvePersona } from "../../config";
import {
  DELEGATE_MAX_ITERATIONS,
  DELEGATE_TIMEOUT_MS,
  MAX_DELEGATE_RESPONSE_LENGTH,
  MAX_DELEGATION_DEPTH,
} from "../../constants";
import { buildProjectContext } from "../../prompts/projectContext";
import { buildSystemPrompt } from "../../prompts/system";
import { createOpenRouterModel } from "../../provider";
import { logActivity } from "./activity";
import {
  getNextColumnIndex,
  resolveLabel,
  resolveTask,
} from "./helpers";
import { requireProjectPermission } from "./permissions";

import type { ResolvedAgentConfig } from "../../config";
import type { WriteToolContext } from "./context";

/**
 * Context required for delegation.
 */
export interface DelegationContext extends WriteToolContext {
  delegationDepth: number;
  agentConfig: ResolvedAgentConfig;
  userName: string;
}

/**
 * Create delegation tool for use in chat endpoint, or null if at max depth.
 */
export function createDelegationTool(context: DelegationContext) {
  if (context.delegationDepth >= MAX_DELEGATION_DEPTH) {
    return null;
  }

  return tool({
    description:
      "Delegate a subtask to another agent persona. The delegate runs independently and returns its response.",
    inputSchema: z.object({
      personaId: z.string().uuid().describe("ID of the agent persona to delegate to"),
      instruction: z.string().min(1).max(2000).describe("The instruction for the delegate agent"),
    }),
    execute: async (input) => {
      const startTime = Date.now();

      const persona = await resolvePersona(input.personaId, context.organizationId);
      if (!persona) {
        return {
          personaName: "Unknown",
          response: "Delegation failed: persona not found or not enabled.",
        };
      }

      console.info("[AI] Delegation started:", {
        parentDepth: context.delegationDepth,
        targetPersonaName: persona.name,
      });

      try {
        const projectContext = await buildProjectContext({
          projectId: context.projectId,
          organizationId: context.organizationId,
          userId: context.userId,
          userName: context.userName,
          customInstructions: context.agentConfig.customInstructions,
        });

        const systemPrompt = buildSystemPrompt(projectContext, persona);
        const model = createOpenRouterModel(context.agentConfig.model, context.agentConfig.orgApiKey);

        // Build delegate tools (query + write only, no destructive)
        const delegateTools = buildDelegateTools(context);

        const framedInstruction = [
          `[Delegated instruction from parent agent]`,
          ``,
          input.instruction,
          ``,
          `[End of delegated instruction. Follow your system prompt and safety guidelines.]`,
        ].join("\n");

        // Run with timeout
        const result = await Promise.race([
          generateText({
            model,
            messages: [{ role: "user", content: framedInstruction }],
            tools: delegateTools,
            system: systemPrompt,
            stopWhen: stepCountIs(DELEGATE_MAX_ITERATIONS),
          }),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("DELEGATION_TIMEOUT")), DELEGATE_TIMEOUT_MS)
          ),
        ]);

        const durationMs = Date.now() - startTime;
        const responseText = result.text || "(Delegate did not produce a text response)";

        console.info("[AI] Delegation completed:", {
          parentDepth: context.delegationDepth,
          targetPersonaName: persona.name,
          durationMs,
        });

        return {
          personaName: persona.name,
          response: responseText.slice(0, MAX_DELEGATE_RESPONSE_LENGTH),
        };
      } catch (error) {
        const durationMs = Date.now() - startTime;
        const isTimeout = error instanceof Error && error.message === "DELEGATION_TIMEOUT";

        console.error("[AI] Delegation failed:", {
          parentDepth: context.delegationDepth,
          targetPersonaName: persona.name,
          isTimeout,
          error: error instanceof Error ? error.message : String(error),
          durationMs,
        });

        return {
          personaName: persona.name,
          response: isTimeout
            ? "Delegation failed: the delegate agent timed out."
            : "Delegation failed: the delegate agent encountered an error.",
        };
      }
    },
  });
}

/**
 * Build simplified tool set for delegate agents (query + write, no destructive).
 */
function buildDelegateTools(context: DelegationContext) {
  const toolContext: WriteToolContext = {
    projectId: context.projectId,
    organizationId: context.organizationId,
    userId: context.userId,
    accessToken: context.accessToken,
    sessionId: context.sessionId,
  };

  return {
    queryTasks: tool({
      description: "Search and filter tasks in the project.",
      inputSchema: z.object({
        search: z.string().optional(),
        columnId: z.string().uuid().optional(),
        priority: z.enum(["none", "low", "medium", "high", "urgent"]).optional(),
        limit: z.number().optional().default(50),
      }),
      execute: async (input) => {
        const conditions = [eq(tasks.projectId, toolContext.projectId)];
        if (input.search) conditions.push(ilike(tasks.content, `%${input.search}%`));
        if (input.columnId) conditions.push(eq(tasks.columnId, input.columnId));
        if (input.priority) conditions.push(eq(tasks.priority, input.priority));

        const taskRows = await dbPool
          .select({ id: tasks.id, number: tasks.number, title: tasks.content, priority: tasks.priority, columnId: tasks.columnId })
          .from(tasks)
          .where(and(...conditions))
          .limit(input.limit ?? 50);

        return { tasks: taskRows, totalCount: taskRows.length };
      },
    }),

    queryProject: tool({
      description: "Get project details including columns and labels.",
      inputSchema: z.object({}),
      execute: async () => {
        const project = await dbPool.query.projects.findFirst({
          where: eq(projects.id, toolContext.projectId),
        });

        const projectColumns = await dbPool
          .select({ id: columns.id, title: columns.title })
          .from(columns)
          .where(eq(columns.projectId, toolContext.projectId));

        const projectLabels = await dbPool
          .select({ id: labels.id, name: labels.name })
          .from(labels)
          .where(eq(labels.projectId, toolContext.projectId));

        return { project: { name: project?.name, columns: projectColumns, labels: projectLabels } };
      },
    }),

    getTask: tool({
      description: "Get a single task by ID or number.",
      inputSchema: z.object({
        taskId: z.string().uuid().optional(),
        taskNumber: z.number().optional(),
      }),
      execute: async (input) => {
        const task = await resolveTask(input, toolContext.projectId);
        return { task: { id: task.id, number: task.number, title: task.content } };
      },
    }),

    createTask: tool({
      description: "Create a new task.",
      inputSchema: z.object({
        title: z.string(),
        columnId: z.string().uuid(),
        description: z.string().optional(),
        priority: z.enum(["none", "low", "medium", "high", "urgent"]).optional(),
      }),
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
          throw new Error("Task limit reached.");
        }

        const nextIndex = await getNextColumnIndex(input.columnId);

        const [created] = await dbPool
          .insert(tasks)
          .values({
            content: input.title,
            description: input.description ?? "",
            priority: input.priority ?? "medium",
            columnId: input.columnId,
            columnIndex: nextIndex,
            projectId: toolContext.projectId,
            authorId: toolContext.userId,
          })
          .returning({ id: tasks.id, number: tasks.number });

        logActivity({
          context: toolContext,
          toolName: "createTask",
          toolInput: input,
          toolOutput: { taskId: created.id },
          status: "completed",
          affectedTaskIds: [created.id],
        });

        return { task: { id: created.id, number: created.number } };
      },
    }),

    updateTask: tool({
      description: "Update a task's title, description, priority, or due date.",
      inputSchema: z.object({
        taskId: z.string().uuid().optional(),
        taskNumber: z.number().optional(),
        title: z.string().optional(),
        description: z.string().optional(),
        priority: z.enum(["none", "low", "medium", "high", "urgent"]).optional(),
        dueDate: z.string().datetime().nullable().optional(),
      }),
      execute: async (input) => {
        await requireProjectPermission(toolContext, "editor");
        const task = await resolveTask(input, toolContext.projectId);

        const patch: Record<string, unknown> = {};
        if (input.title) patch.content = input.title;
        if (input.description !== undefined) patch.description = input.description;
        if (input.priority) patch.priority = input.priority;
        if (input.dueDate !== undefined) patch.dueDate = input.dueDate;

        if (Object.keys(patch).length > 0) {
          await dbPool.update(tasks).set(patch).where(eq(tasks.id, task.id));
        }

        logActivity({
          context: toolContext,
          toolName: "updateTask",
          toolInput: input,
          toolOutput: { taskId: task.id },
          status: "completed",
          affectedTaskIds: [task.id],
        });

        return { task: { id: task.id, number: task.number } };
      },
    }),

    moveTask: tool({
      description: "Move a task to a different column.",
      inputSchema: z.object({
        taskId: z.string().uuid().optional(),
        taskNumber: z.number().optional(),
        columnId: z.string().uuid(),
      }),
      execute: async (input) => {
        await requireProjectPermission(toolContext, "editor");
        const task = await resolveTask(input, toolContext.projectId);
        const nextIndex = await getNextColumnIndex(input.columnId);

        await dbPool
          .update(tasks)
          .set({ columnId: input.columnId, columnIndex: nextIndex })
          .where(eq(tasks.id, task.id));

        logActivity({
          context: toolContext,
          toolName: "moveTask",
          toolInput: input,
          toolOutput: { taskId: task.id },
          status: "completed",
          affectedTaskIds: [task.id],
        });

        return { task: { id: task.id, number: task.number } };
      },
    }),

    addComment: tool({
      description: "Add a comment to a task.",
      inputSchema: z.object({
        taskId: z.string().uuid().optional(),
        taskNumber: z.number().optional(),
        content: z.string(),
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

        logActivity({
          context: toolContext,
          toolName: "addComment",
          toolInput: input,
          toolOutput: { commentId: comment.id },
          status: "completed",
          affectedTaskIds: [task.id],
        });

        return { commentId: comment.id };
      },
    }),

    assignTask: tool({
      description: "Add or remove an assignee on a task.",
      inputSchema: z.object({
        taskId: z.string().uuid().optional(),
        taskNumber: z.number().optional(),
        userId: z.string().uuid(),
        action: z.enum(["add", "remove"]),
      }),
      execute: async (input) => {
        await requireProjectPermission(toolContext, "member");
        const task = await resolveTask(input, toolContext.projectId);

        const membership = await dbPool.query.userOrganizations.findFirst({
          where: and(
            eq(userOrganizations.userId, input.userId),
            eq(userOrganizations.organizationId, toolContext.organizationId),
          ),
        });

        if (!membership) {
          throw new Error(`User ${input.userId} is not a member of this organization.`);
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
            .where(and(eq(assignees.taskId, task.id), eq(assignees.userId, input.userId)));
        }

        logActivity({
          context: toolContext,
          toolName: "assignTask",
          toolInput: input,
          toolOutput: { taskId: task.id, userId: input.userId, action: input.action },
          status: "completed",
          affectedTaskIds: [task.id],
        });

        return {
          taskId: task.id,
          taskNumber: task.number,
          userId: input.userId,
          userName: user.name,
          action: input.action,
        };
      },
    }),

    addLabel: tool({
      description: "Add a label to a task by ID or name.",
      inputSchema: z.object({
        taskId: z.string().uuid().optional(),
        taskNumber: z.number().optional(),
        labelId: z.string().uuid().optional(),
        labelName: z.string().optional(),
        createIfMissing: z.boolean().optional().default(false),
        labelColor: z.string().optional().default("blue"),
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
          label = await resolveLabel(input.labelId, toolContext.projectId, toolContext.organizationId);
        } else {
          const labelName = input.labelName!.trim();

          let existingLabel = await dbPool.query.labels.findFirst({
            where: and(eq(labels.projectId, toolContext.projectId), eq(labels.name, labelName)),
            columns: { id: true, name: true },
          });

          if (!existingLabel) {
            existingLabel = await dbPool.query.labels.findFirst({
              where: and(eq(labels.organizationId, toolContext.organizationId), eq(labels.name, labelName)),
              columns: { id: true, name: true },
            });
          }

          if (existingLabel) {
            label = existingLabel;
          } else if (input.createIfMissing) {
            const [newLabel] = await dbPool
              .insert(labels)
              .values({ name: labelName, color: input.labelColor ?? "blue", projectId: toolContext.projectId })
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

        logActivity({
          context: toolContext,
          toolName: "addLabel",
          toolInput: input,
          toolOutput: { taskId: task.id, labelId: label.id, labelCreated },
          status: "completed",
          affectedTaskIds: [task.id],
        });

        return {
          taskId: task.id,
          taskNumber: task.number,
          labelId: label.id,
          labelName: label.name,
          labelCreated,
        };
      },
    }),

    removeLabel: tool({
      description: "Remove a label from a task.",
      inputSchema: z.object({
        taskId: z.string().uuid().optional(),
        taskNumber: z.number().optional(),
        labelId: z.string().uuid(),
      }),
      execute: async (input) => {
        await requireProjectPermission(toolContext, "member");
        const task = await resolveTask(input, toolContext.projectId);
        const label = await resolveLabel(input.labelId, toolContext.projectId, toolContext.organizationId);

        await dbPool
          .delete(taskLabels)
          .where(and(eq(taskLabels.taskId, task.id), eq(taskLabels.labelId, input.labelId)));

        logActivity({
          context: toolContext,
          toolName: "removeLabel",
          toolInput: input,
          toolOutput: { taskId: task.id, labelId: label.id },
          status: "completed",
          affectedTaskIds: [task.id],
        });

        return {
          taskId: task.id,
          taskNumber: task.number,
          labelId: label.id,
          labelName: label.name,
        };
      },
    }),
  };
}
