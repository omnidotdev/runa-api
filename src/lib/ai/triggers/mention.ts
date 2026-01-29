/**
 * @agent / @runa mention trigger system.
 *
 * Detects @agent and @runa mentions in comment text, rate-limits per task,
 * and orchestrates a background agent session that processes the instruction
 * and posts a reply comment.
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
import { isAgentEnabled } from "lib/flags";
import { resolveAgentConfig } from "../config";
import { buildProjectContext } from "../prompts/projectContext";
import { buildSystemPrompt } from "../prompts/system";
import { createOpenRouterModel } from "../provider";
import { checkRateLimit } from "../rateLimit";
import { createSession, saveSessionMessages } from "../session/manager";
import {
  getNextColumnIndex,
  logActivity,
  resolveLabel,
  resolveTask,
} from "../tools/server";

import type { WriteToolContext } from "../tools/server";

// ─────────────────────────────────────────────
// Mention Detection
// ─────────────────────────────────────────────

export const MAX_INSTRUCTION_LENGTH = 2_000;

export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function textToHtml(text: string): string {
  const paragraphs = text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  if (paragraphs.length === 0) return "<p></p>";
  return paragraphs.map((p) => `<p>${escapeHtml(p)}</p>`).join("");
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

interface MentionDetectionResult {
  hasMention: boolean;
  instruction: string;
}

export function detectMention(htmlContent: string): MentionDetectionResult {
  const plainText = stripHtml(htmlContent);
  const hasMention = /@(?:agent|runa)\b/i.test(plainText);

  const instruction = plainText
    .replace(/@(?:agent|runa)\b/gi, "")
    .trim()
    .slice(0, MAX_INSTRUCTION_LENGTH);

  return { hasMention, instruction };
}

// ─────────────────────────────────────────────
// Rate Limiting
// ─────────────────────────────────────────────

const TASK_RATE_LIMIT = { maxRequests: 3, windowMs: 3_600_000 } as const;
const USER_RATE_LIMIT = { maxRequests: 10, windowMs: 3_600_000 } as const;

// ─────────────────────────────────────────────
// Mention Handler
// ─────────────────────────────────────────────

export interface MentionContext {
  taskId: string;
  userId: string;
  accessToken: string;
  commentText: string;
}

export async function handleMention(ctx: MentionContext): Promise<void> {
  try {
    const enabled = await isAgentEnabled();
    if (!enabled) return;

    const userRateResult = checkRateLimit(
      `mention:user:${ctx.userId}`,
      USER_RATE_LIMIT,
    );
    if (!userRateResult.allowed) return;

    const taskRateResult = checkRateLimit(
      `mention:task:${ctx.taskId}`,
      TASK_RATE_LIMIT,
    );
    if (!taskRateResult.allowed) return;

    const task = await dbPool.query.tasks.findFirst({
      where: eq(tasks.id, ctx.taskId),
      columns: { id: true, projectId: true, content: true, number: true },
    });
    if (!task) return;

    const project = await dbPool.query.projects.findFirst({
      where: eq(projects.id, task.projectId),
      columns: { id: true, organizationId: true },
    });
    if (!project) return;

    const organizationId = project.organizationId;
    const projectId = task.projectId;

    const agentConfig = await resolveAgentConfig(organizationId);

    const session = await createSession({
      organizationId,
      projectId,
      userId: ctx.userId,
      title: `@mention on T-${task.number}`,
    });

    const user = await dbPool.query.users.findFirst({
      where: eq(users.id, ctx.userId),
      columns: { name: true },
    });

    const projectContext = await buildProjectContext({
      projectId,
      organizationId,
      userId: ctx.userId,
      userName: user?.name ?? "Unknown",
      customInstructions: agentConfig.customInstructions,
    });

    const systemPrompt = buildSystemPrompt(
      projectContext,
      agentConfig.defaultPersona,
    );
    const model = createOpenRouterModel(
      agentConfig.model,
      agentConfig.orgApiKey,
    );

    const toolContext: WriteToolContext = {
      projectId,
      organizationId,
      userId: ctx.userId,
      accessToken: ctx.accessToken,
      sessionId: session.id,
    };

    const aiTools = buildMentionTools(toolContext);

    const { instruction } = detectMention(ctx.commentText);

    const userMessage = instruction
      ? `A user mentioned you in a comment on task T-${task.number} ("${task.content}"). Their instruction: "${instruction}". Respond concisely.`
      : `A user mentioned you in a comment on task T-${task.number} ("${task.content}"). Review the task and provide a brief helpful summary.`;

    const result = await generateText({
      model,
      messages: [{ role: "user", content: userMessage }],
      tools: aiTools,
      system: systemPrompt,
      stopWhen: stepCountIs(agentConfig.maxIterations),
    });

    const allMessages: Array<{ role: "user" | "assistant"; content: string }> =
      [{ role: "user", content: userMessage }];

    if (result.text) {
      const replyHtml = textToHtml(result.text);

      await dbPool.insert(posts).values({
        description: replyHtml,
        authorId: null,
        taskId: ctx.taskId,
      });

      allMessages.push({ role: "assistant", content: result.text });
    }

    await saveSessionMessages(session.id, allMessages);

    console.info("[AI Mention] Completed:", {
      taskId: ctx.taskId,
      taskNumber: task.number,
      sessionId: session.id,
      hasResponse: !!result.text,
    });
  } catch (err) {
    console.error("[AI Mention] Error:", {
      taskId: ctx.taskId,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

// ─────────────────────────────────────────────
// Tools for Mention-triggered Agents
// ─────────────────────────────────────────────

function buildMentionTools(toolContext: WriteToolContext) {
  return {
    queryTasks: tool({
      description: "Search and filter tasks in the project.",
      inputSchema: z.object({
        search: z.string().optional(),
        columnId: z.string().uuid().optional(),
        priority: z
          .enum(["none", "low", "medium", "high", "urgent"])
          .optional(),
        limit: z.number().optional().default(50),
      }),
      execute: async (input) => {
        const conditions = [eq(tasks.projectId, toolContext.projectId)];
        if (input.search)
          conditions.push(ilike(tasks.content, `%${input.search}%`));
        if (input.columnId) conditions.push(eq(tasks.columnId, input.columnId));
        if (input.priority) conditions.push(eq(tasks.priority, input.priority));

        const taskRows = await dbPool
          .select({
            id: tasks.id,
            number: tasks.number,
            title: tasks.content,
            priority: tasks.priority,
            columnId: tasks.columnId,
          })
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

        return {
          project: {
            name: project?.name,
            columns: projectColumns,
            labels: projectLabels,
          },
        };
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
        return {
          task: { id: task.id, number: task.number, title: task.content },
        };
      },
    }),

    createTask: tool({
      description: "Create a new task.",
      inputSchema: z.object({
        title: z.string(),
        columnId: z.string().uuid(),
        description: z.string().optional(),
        priority: z
          .enum(["none", "low", "medium", "high", "urgent"])
          .optional(),
      }),
      execute: async (input) => {
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

        if (!withinLimit) throw new Error("Task limit reached.");

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
        priority: z
          .enum(["none", "low", "medium", "high", "urgent"])
          .optional(),
        dueDate: z.string().datetime().nullable().optional(),
      }),
      execute: async (input) => {
        const task = await resolveTask(input, toolContext.projectId);

        const patch: Record<string, unknown> = {};
        if (input.title) patch.content = input.title;
        if (input.description !== undefined)
          patch.description = input.description;
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
        const task = await resolveTask(input, toolContext.projectId);

        const membership = await dbPool.query.userOrganizations.findFirst({
          where: and(
            eq(userOrganizations.userId, input.userId),
            eq(userOrganizations.organizationId, toolContext.organizationId),
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

        logActivity({
          context: toolContext,
          toolName: "assignTask",
          toolInput: input,
          toolOutput: {
            taskId: task.id,
            userId: input.userId,
            action: input.action,
          },
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
