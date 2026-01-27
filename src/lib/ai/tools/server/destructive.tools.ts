/**
 * Destructive & batch tool implementations for the Runa AI Agent.
 *
 * These tools perform irreversible or bulk operations and support
 * dynamic approval gating via the withApproval() helper.
 *
 * All tools follow the same pattern as write.tools.ts:
 *  1. Check permission via requireProjectPermission()
 *  2. Resolve task(s)
 *  3. Execute Drizzle ORM operation
 *  4. Log activity (fire-and-forget)
 *  5. Return typed output
 *
 * Batch tools use partial-success semantics: individual task errors are
 * collected into an `errors[]` array rather than failing the entire batch.
 */

import { and, eq } from "drizzle-orm";

import { dbPool } from "lib/db/db";
import { columns, tasks } from "lib/db/schema";

import {
  batchDeleteTasksDef,
  batchMoveTasksDef,
  batchUpdateTasksDef,
  deleteTaskDef,
  withApproval,
} from "../definitions";
import { logActivity } from "./activity";
import { getNextColumnIndex, resolveTask } from "./helpers";
import { requireProjectPermission } from "./permissions";

import type { WriteToolContext } from "./context";
import type { ResolvedAgentConfig } from "../../config";

// ─────────────────────────────────────────────
// Factory
// ─────────────────────────────────────────────

/**
 * Create destructive/batch tools scoped to a project with full auth context.
 *
 * When `agentConfig.requireApprovalForDestructive` is true, all tools in this
 * factory will pause for user approval before executing.
 */
export function createDestructiveTools(
  context: WriteToolContext,
  agentConfig: ResolvedAgentConfig,
) {
  const needsApproval = agentConfig.requireApprovalForDestructive;

  // ── deleteTask ─────────────────────────────
  const deleteTask = withApproval(deleteTaskDef, needsApproval).server(
    async (input) => {
      try {
        await requireProjectPermission(context, "editor");
      } catch (err) {
        logActivity({
          context,
          toolName: "deleteTask",
          toolInput: input,
          status: "denied",
          requiresApproval: needsApproval,
          errorMessage:
            err instanceof Error ? err.message : "Permission denied",
        });
        throw err;
      }

      try {
        const task = await resolveTask(input, context.projectId);

        await dbPool.delete(tasks).where(eq(tasks.id, task.id));

        const result = {
          deletedTaskId: task.id,
          deletedTaskNumber: task.number,
          deletedTaskTitle: task.content,
        };

        logActivity({
          context,
          toolName: "deleteTask",
          toolInput: input,
          toolOutput: result,
          status: "completed",
          requiresApproval: needsApproval,
          affectedTaskIds: [task.id],
        });

        return result;
      } catch (err) {
        logActivity({
          context,
          toolName: "deleteTask",
          toolInput: input,
          status: "failed",
          requiresApproval: needsApproval,
          errorMessage: err instanceof Error ? err.message : "Unknown error",
        });
        throw err;
      }
    },
  );

  // ── batchMoveTasks ─────────────────────────
  const batchMoveTasks = withApproval(batchMoveTasksDef, needsApproval).server(
    async (input) => {
      try {
        await requireProjectPermission(context, "editor");
      } catch (err) {
        logActivity({
          context,
          toolName: "batchMoveTasks",
          toolInput: input,
          status: "denied",
          requiresApproval: needsApproval,
          errorMessage:
            err instanceof Error ? err.message : "Permission denied",
        });
        throw err;
      }

      try {
        // Validate target column belongs to this project
        const targetColumn = await dbPool.query.columns.findFirst({
          where: and(
            eq(columns.id, input.columnId),
            eq(columns.projectId, context.projectId),
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
        const errors: Array<{ ref: string; message: string }> = [];
        const affectedIds: string[] = [];

        // Pre-fetch the base index once to avoid duplicate indices within the batch
        let nextIndex = await getNextColumnIndex(input.columnId);

        for (const taskRef of input.tasks) {
          const ref = taskRef.taskId ?? `T-${taskRef.taskNumber}`;
          try {
            const task = await resolveTask(taskRef, context.projectId);

            // Get source column title
            const sourceColumn = await dbPool.query.columns.findFirst({
              where: eq(columns.id, task.columnId),
              columns: { title: true },
            });

            await dbPool
              .update(tasks)
              .set({
                columnId: input.columnId,
                columnIndex: nextIndex,
              })
              .where(eq(tasks.id, task.id));

            nextIndex++;

            movedTasks.push({
              id: task.id,
              number: task.number,
              title: task.content,
              fromColumn: sourceColumn?.title ?? "Unknown",
            });
            affectedIds.push(task.id);
          } catch (err) {
            errors.push({
              ref,
              message: err instanceof Error ? err.message : "Unknown error",
            });
          }
        }

        const result = {
          movedCount: movedTasks.length,
          targetColumn: targetColumn.title,
          movedTasks,
          errors,
        };

        logActivity({
          context,
          toolName: "batchMoveTasks",
          toolInput: input,
          toolOutput: result,
          status: errors.length > 0 && movedTasks.length === 0 ? "failed" : "completed",
          requiresApproval: needsApproval,
          affectedTaskIds: affectedIds,
        });

        return result;
      } catch (err) {
        logActivity({
          context,
          toolName: "batchMoveTasks",
          toolInput: input,
          status: "failed",
          requiresApproval: needsApproval,
          errorMessage: err instanceof Error ? err.message : "Unknown error",
        });
        throw err;
      }
    },
  );

  // ── batchUpdateTasks ───────────────────────
  const batchUpdateTasks = withApproval(
    batchUpdateTasksDef,
    needsApproval,
  ).server(async (input) => {
    try {
      await requireProjectPermission(context, "editor");
    } catch (err) {
      logActivity({
        context,
        toolName: "batchUpdateTasks",
        toolInput: input,
        status: "denied",
        requiresApproval: needsApproval,
        errorMessage: err instanceof Error ? err.message : "Permission denied",
      });
      throw err;
    }

    try {
      // Build immutable patch from provided fields
      const patch: Record<string, unknown> = {};
      if (input.priority !== undefined) patch.priority = input.priority;
      if (input.dueDate !== undefined) patch.dueDate = input.dueDate;

      if (Object.keys(patch).length === 0) {
        throw new Error(
          "No fields to update. Provide at least priority or dueDate.",
        );
      }

      const updatedTasks: Array<{
        id: string;
        number: number | null;
        title: string;
      }> = [];
      const errors: Array<{ ref: string; message: string }> = [];
      const affectedIds: string[] = [];

      for (const taskRef of input.tasks) {
        const ref = taskRef.taskId ?? `T-${taskRef.taskNumber}`;
        try {
          const task = await resolveTask(taskRef, context.projectId);

          await dbPool
            .update(tasks)
            .set(patch)
            .where(eq(tasks.id, task.id));

          updatedTasks.push({
            id: task.id,
            number: task.number,
            title: task.content,
          });
          affectedIds.push(task.id);
        } catch (err) {
          errors.push({
            ref,
            message: err instanceof Error ? err.message : "Unknown error",
          });
        }
      }

      const result = {
        updatedCount: updatedTasks.length,
        updatedTasks,
        errors,
      };

      logActivity({
        context,
        toolName: "batchUpdateTasks",
        toolInput: input,
        toolOutput: result,
        status: errors.length > 0 && updatedTasks.length === 0 ? "failed" : "completed",
        requiresApproval: needsApproval,
        affectedTaskIds: affectedIds,
      });

      return result;
    } catch (err) {
      logActivity({
        context,
        toolName: "batchUpdateTasks",
        toolInput: input,
        status: "failed",
        requiresApproval: needsApproval,
        errorMessage: err instanceof Error ? err.message : "Unknown error",
      });
      throw err;
    }
  });

  // ── batchDeleteTasks ───────────────────────
  const batchDeleteTasks = withApproval(
    batchDeleteTasksDef,
    needsApproval,
  ).server(async (input) => {
    try {
      await requireProjectPermission(context, "editor");
    } catch (err) {
      logActivity({
        context,
        toolName: "batchDeleteTasks",
        toolInput: input,
        status: "denied",
        requiresApproval: needsApproval,
        errorMessage: err instanceof Error ? err.message : "Permission denied",
      });
      throw err;
    }

    try {
      const deletedTasks: Array<{
        id: string;
        number: number | null;
        title: string;
      }> = [];
      const errors: Array<{ ref: string; message: string }> = [];
      const affectedIds: string[] = [];

      for (const taskRef of input.tasks) {
        const ref = taskRef.taskId ?? `T-${taskRef.taskNumber}`;
        try {
          const task = await resolveTask(taskRef, context.projectId);

          await dbPool.delete(tasks).where(eq(tasks.id, task.id));

          deletedTasks.push({
            id: task.id,
            number: task.number,
            title: task.content,
          });
          affectedIds.push(task.id);
        } catch (err) {
          errors.push({
            ref,
            message: err instanceof Error ? err.message : "Unknown error",
          });
        }
      }

      const result = {
        deletedCount: deletedTasks.length,
        deletedTasks,
        errors,
      };

      logActivity({
        context,
        toolName: "batchDeleteTasks",
        toolInput: input,
        toolOutput: result,
        status: errors.length > 0 && deletedTasks.length === 0 ? "failed" : "completed",
        requiresApproval: needsApproval,
        affectedTaskIds: affectedIds,
      });

      return result;
    } catch (err) {
      logActivity({
        context,
        toolName: "batchDeleteTasks",
        toolInput: input,
        status: "failed",
        requiresApproval: needsApproval,
        errorMessage: err instanceof Error ? err.message : "Unknown error",
      });
      throw err;
    }
  });

  return {
    deleteTask,
    batchMoveTasks,
    batchUpdateTasks,
    batchDeleteTasks,
  };
}
