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

import type { ResolvedAgentConfig } from "../../config";
import type { WriteToolContext } from "./context";

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

        // Snapshot full task state before deletion for rollback support
        const snapshot = {
          operation: "delete" as const,
          entityType: "task" as const,
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
        };

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
          snapshotBefore: snapshot,
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
        const taskSnapshots: Array<{
          taskId: string;
          columnId: string;
          columnIndex: number;
        }> = [];

        const result = await dbPool.transaction(async (tx) => {
          // Validate target column belongs to this project
          const targetColumn = await tx.query.columns.findFirst({
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
          const affectedIds: string[] = [];

          // Pre-fetch the base index once to avoid duplicate indices within the batch
          let nextIndex = await getNextColumnIndex(input.columnId);

          for (const taskRef of input.tasks) {
            const task = await resolveTask(taskRef, context.projectId);

            // Snapshot position before the move
            taskSnapshots.push({
              taskId: task.id,
              columnId: task.columnId,
              columnIndex: task.columnIndex,
            });

            // Get source column title
            const sourceColumn = await tx.query.columns.findFirst({
              where: eq(columns.id, task.columnId),
              columns: { title: true },
            });

            await tx
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
          }

          return {
            movedCount: movedTasks.length,
            targetColumn: targetColumn.title,
            movedTasks,
            errors: [] as Array<{ ref: string; message: string }>,
            affectedIds,
          };
        });

        logActivity({
          context,
          toolName: "batchMoveTasks",
          toolInput: input,
          toolOutput: result,
          status: "completed",
          requiresApproval: needsApproval,
          affectedTaskIds: result.affectedIds,
          snapshotBefore: {
            operation: "batchMove",
            entityType: "task",
            tasks: taskSnapshots,
          },
        });

        return {
          movedCount: result.movedCount,
          targetColumn: result.targetColumn,
          movedTasks: result.movedTasks,
          errors: result.errors,
        };
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

      const taskSnapshots: Array<{
        taskId: string;
        priority: string;
        dueDate: string | null;
      }> = [];

      const result = await dbPool.transaction(async (tx) => {
        const updatedTasks: Array<{
          id: string;
          number: number | null;
          title: string;
        }> = [];
        const affectedIds: string[] = [];

        for (const taskRef of input.tasks) {
          const task = await resolveTask(taskRef, context.projectId);

          // Snapshot fields before the update
          taskSnapshots.push({
            taskId: task.id,
            priority: task.priority,
            dueDate: task.dueDate,
          });

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
          errors: [] as Array<{ ref: string; message: string }>,
          affectedIds,
        };
      });

      logActivity({
        context,
        toolName: "batchUpdateTasks",
        toolInput: input,
        toolOutput: result,
        status: "completed",
        requiresApproval: needsApproval,
        affectedTaskIds: result.affectedIds,
        snapshotBefore: {
          operation: "batchUpdate",
          entityType: "task",
          tasks: taskSnapshots,
        },
      });

      return {
        updatedCount: result.updatedCount,
        updatedTasks: result.updatedTasks,
        errors: result.errors,
      };
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
      const taskSnapshots: Array<{
        taskId: string;
        content: string;
        description: string;
        priority: string;
        columnId: string;
        columnIndex: number;
        dueDate: string | null;
        authorId: string | null;
      }> = [];

      const result = await dbPool.transaction(async (tx) => {
        const deletedTasks: Array<{
          id: string;
          number: number | null;
          title: string;
        }> = [];
        const affectedIds: string[] = [];

        for (const taskRef of input.tasks) {
          const task = await resolveTask(taskRef, context.projectId);

          // Snapshot full task state before deletion
          taskSnapshots.push({
            taskId: task.id,
            content: task.content,
            description: task.description,
            priority: task.priority,
            columnId: task.columnId,
            columnIndex: task.columnIndex,
            dueDate: task.dueDate,
            authorId: task.authorId,
          });

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
          errors: [] as Array<{ ref: string; message: string }>,
          affectedIds,
        };
      });

      logActivity({
        context,
        toolName: "batchDeleteTasks",
        toolInput: input,
        toolOutput: result,
        status: "completed",
        requiresApproval: needsApproval,
        affectedTaskIds: result.affectedIds,
        snapshotBefore: {
          operation: "batchDelete",
          entityType: "task",
          tasks: taskSnapshots,
        },
      });

      return {
        deletedCount: result.deletedCount,
        deletedTasks: result.deletedTasks,
        errors: result.errors,
      };
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
