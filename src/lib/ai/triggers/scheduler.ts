/**
 * Scheduled agent run system.
 *
 * Uses croner to run a DB-polled background interval that checks for
 * schedules where `enabled = true AND next_run_at <= NOW()`, then triggers
 * a scoped agent session for each due schedule.
 */

import { generateText, stepCountIs, tool } from "ai";
import { Cron } from "croner";
import { and, count, eq, ilike, lte, sql } from "drizzle-orm";
import { z } from "zod";

import { dbPool } from "lib/db/db";
import {
  agentPersonas,
  agentSchedules,
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
import { createSession, saveSessionMessages } from "../session/manager";
import {
  getNextColumnIndex,
  logActivity,
  resolveLabel,
  resolveTask,
} from "../tools/server";

import type { SelectAgentSchedule } from "lib/db/schema/agentSchedule.table";
import type { WriteToolContext } from "../tools/server";

// ─────────────────────────────────────────────
// Concurrency Guard
// ─────────────────────────────────────────────

const runningSchedules = new Set<string>();

// ─────────────────────────────────────────────
// Next Run Computation
// ─────────────────────────────────────────────

export function computeNextRun(cronExpression: string): Date | null {
  try {
    const job = new Cron(cronExpression);
    return job.nextRun();
  } catch {
    return null;
  }
}

export function isValidCron(cronExpression: string): boolean {
  try {
    new Cron(cronExpression);
    return true;
  } catch {
    return false;
  }
}

const MIN_INTERVAL_MS = 5 * 60 * 1_000;

export function isMinimumInterval(cronExpression: string): boolean {
  try {
    const job = new Cron(cronExpression);
    const first = job.nextRun();
    if (!first) return false;
    const second = job.nextRun(first);
    if (!second) return true;
    return second.getTime() - first.getTime() >= MIN_INTERVAL_MS;
  } catch {
    return false;
  }
}

// ─────────────────────────────────────────────
// Schedule Execution
// ─────────────────────────────────────────────

async function executeSchedule(schedule: SelectAgentSchedule): Promise<void> {
  const organizationId = schedule.organizationId;
  const agentConfig = await resolveAgentConfig(organizationId);

  const orgMembership = await dbPool.query.userOrganizations.findFirst({
    where: eq(userOrganizations.organizationId, organizationId),
    columns: { userId: true },
    with: { user: { columns: { id: true, name: true } } },
  });
  if (!orgMembership?.user) return;

  const user = orgMembership.user;

  const session = await createSession({
    organizationId,
    projectId: schedule.projectId,
    userId: user.id,
    title: `Schedule: ${schedule.name}`,
  });

  let persona = agentConfig.defaultPersona;
  if (schedule.personaId) {
    const schedulePersona = await dbPool.query.agentPersonas.findFirst({
      where: and(
        eq(agentPersonas.id, schedule.personaId),
        eq(agentPersonas.organizationId, organizationId),
        eq(agentPersonas.enabled, true),
      ),
    });
    if (schedulePersona) {
      persona = schedulePersona;
    }
  }

  const projectContext = await buildProjectContext({
    projectId: schedule.projectId,
    organizationId,
    userId: user.id,
    userName: "Scheduled Agent",
    customInstructions: agentConfig.customInstructions,
  });

  const systemPrompt = buildSystemPrompt(projectContext, persona);
  const model = createOpenRouterModel(agentConfig.model, agentConfig.orgApiKey);

  const toolContext: WriteToolContext = {
    projectId: schedule.projectId,
    organizationId,
    userId: user.id,
    accessToken: "",
    sessionId: session.id,
  };

  const aiTools = buildScheduleTools(toolContext);

  const userMessage = `This is a scheduled run for "${schedule.name}". ${schedule.instruction}`;

  const result = await generateText({
    model,
    messages: [{ role: "user", content: userMessage }],
    tools: aiTools,
    system: systemPrompt,
    stopWhen: stepCountIs(agentConfig.maxIterations),
  });

  const allMessages = [
    { role: "user" as const, content: userMessage },
    ...(result.text
      ? [{ role: "assistant" as const, content: result.text }]
      : []),
  ];

  await saveSessionMessages(session.id, allMessages);
}

// ─────────────────────────────────────────────
// DB Polling
// ─────────────────────────────────────────────

export async function pollSchedules(): Promise<void> {
  try {
    const enabled = await isAgentEnabled();
    if (!enabled) return;

    const claimedSchedules = await dbPool
      .update(agentSchedules)
      .set({
        lastRunAt: sql`now()`,
        nextRunAt: null,
        updatedAt: sql`now()`,
      })
      .where(
        and(
          eq(agentSchedules.enabled, true),
          lte(agentSchedules.nextRunAt, sql`now()`),
        ),
      )
      .returning();

    if (claimedSchedules.length === 0) return;

    console.info(
      `[AI Scheduler] Claimed ${claimedSchedules.length} due schedule(s)`,
    );

    for (const schedule of claimedSchedules) {
      if (runningSchedules.has(schedule.id)) {
        const nextRun = computeNextRun(schedule.cronExpression);
        dbPool
          .update(agentSchedules)
          .set({ nextRunAt: nextRun, updatedAt: sql`now()` })
          .where(eq(agentSchedules.id, schedule.id))
          .catch(() => {});
        continue;
      }

      runningSchedules.add(schedule.id);

      executeSchedule(schedule)
        .then(() => {
          console.info("[AI Scheduler] Completed:", {
            scheduleId: schedule.id,
            name: schedule.name,
          });
        })
        .catch((err) => {
          console.error("[AI Scheduler] Execution failed:", {
            scheduleId: schedule.id,
            error: err instanceof Error ? err.message : String(err),
          });
        })
        .finally(() => {
          runningSchedules.delete(schedule.id);
          const nextRun = computeNextRun(schedule.cronExpression);
          dbPool
            .update(agentSchedules)
            .set({ nextRunAt: nextRun, updatedAt: sql`now()` })
            .where(eq(agentSchedules.id, schedule.id))
            .catch(() => {});
        });
    }
  } catch (err) {
    console.error(
      "[AI Scheduler] Poll error:",
      err instanceof Error ? err.message : String(err),
    );
  }
}

// ─────────────────────────────────────────────
// Manual Trigger
// ─────────────────────────────────────────────

export async function executeScheduleById(scheduleId: string): Promise<void> {
  if (runningSchedules.has(scheduleId)) {
    throw new Error(`Schedule ${scheduleId} is already running`);
  }

  runningSchedules.add(scheduleId);
  try {
    const schedule = await dbPool.query.agentSchedules.findFirst({
      where: eq(agentSchedules.id, scheduleId),
    });

    if (!schedule) {
      throw new Error(`Schedule ${scheduleId} not found`);
    }

    await dbPool
      .update(agentSchedules)
      .set({ lastRunAt: new Date(), updatedAt: sql`now()` })
      .where(eq(agentSchedules.id, scheduleId));

    await executeSchedule(schedule);

    console.info("[AI Scheduler] Manual run completed:", {
      scheduleId,
      name: schedule.name,
    });
  } finally {
    runningSchedules.delete(scheduleId);
  }
}

// ─────────────────────────────────────────────
// Tools for Scheduled Agents
// ─────────────────────────────────────────────

function buildScheduleTools(toolContext: WriteToolContext) {
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
