/**
 * Factory for creating destructive tools.
 *
 * Destructive tools can permanently modify or delete data.
 * They require editor permission and may require approval.
 *
 * Note: Unlike write tools, destructive tools always check permissions
 * (no `skipPermissionCheck` option) because they can cause irreversible
 * data loss. Even in trusted contexts like triggers, destructive operations
 * should be gated.
 */

import { tool } from "ai";

import {
  batchDeleteTasksSchema,
  batchMoveTasksSchema,
  batchUpdateTasksSchema,
  deleteTaskSchema,
} from "../core/schemas";
import {
  BATCH_DELETE_TASKS_DESCRIPTION,
  BATCH_MOVE_TASKS_DESCRIPTION,
  BATCH_UPDATE_TASKS_DESCRIPTION,
  DELETE_TASK_DESCRIPTION,
  executeBatchDeleteTasks,
  executeBatchMoveTasks,
  executeBatchUpdateTasks,
  executeDeleteTask,
} from "../definitions/destructive";
import { logActivity } from "../wrappers/withActivityLogging";
import { requireProjectPermission } from "../wrappers/withPermission";

import type { WriteToolContext } from "../core/context";
import type { DestructiveToolsOptions } from "../types";

export function createDestructiveTools(
  ctx: WriteToolContext,
  options: DestructiveToolsOptions = {},
) {
  const { requireApproval = false } = options;

  /** Log a failed tool execution for audit trail. */
  const logFailure = (toolName: string, input: unknown, error: unknown) => {
    logActivity({
      context: ctx,
      toolName,
      toolInput: input,
      status: "failed",
      requiresApproval: requireApproval,
      errorMessage: error instanceof Error ? error.message : String(error),
    });
  };

  return {
    deleteTask: tool({
      description: DELETE_TASK_DESCRIPTION,
      inputSchema: deleteTaskSchema,
      needsApproval: requireApproval,
      execute: async (input) => {
        try {
          await requireProjectPermission(ctx, "editor");

          const result = await executeDeleteTask(input, ctx);

          logActivity({
            context: ctx,
            toolName: "deleteTask",
            toolInput: input,
            toolOutput: {
              deletedTaskId: result.deletedTaskId,
              deletedTaskNumber: result.deletedTaskNumber,
              deletedTaskTitle: result.deletedTaskTitle,
            },
            status: "completed",
            requiresApproval: requireApproval,
            affectedTaskIds: [result.deletedTaskId],
            snapshotBefore: {
              operation: "delete",
              entityType: "task",
              entityId: result.deletedTaskId,
              previousState: result.snapshotBefore,
            },
          });

          return {
            deletedTaskId: result.deletedTaskId,
            deletedTaskNumber: result.deletedTaskNumber,
            deletedTaskTitle: result.deletedTaskTitle,
          };
        } catch (error) {
          logFailure("deleteTask", input, error);
          throw error;
        }
      },
    }),

    batchMoveTasks: tool({
      description: BATCH_MOVE_TASKS_DESCRIPTION,
      inputSchema: batchMoveTasksSchema,
      needsApproval: requireApproval,
      execute: async (input) => {
        try {
          await requireProjectPermission(ctx, "editor");

          const result = await executeBatchMoveTasks(input, ctx);

          logActivity({
            context: ctx,
            toolName: "batchMoveTasks",
            toolInput: input,
            toolOutput: {
              movedCount: result.movedCount,
              targetColumn: result.targetColumn,
              movedTasks: result.movedTasks,
              errors: result.errors,
            },
            status: "completed",
            requiresApproval: requireApproval,
            affectedTaskIds: result.affectedIds,
            snapshotBefore: {
              operation: "batchMove",
              entityType: "task",
              tasks: result.snapshotBefore,
            },
          });

          return {
            movedCount: result.movedCount,
            targetColumn: result.targetColumn,
            movedTasks: result.movedTasks,
            errors: result.errors,
          };
        } catch (error) {
          logFailure("batchMoveTasks", input, error);
          throw error;
        }
      },
    }),

    batchUpdateTasks: tool({
      description: BATCH_UPDATE_TASKS_DESCRIPTION,
      inputSchema: batchUpdateTasksSchema,
      needsApproval: requireApproval,
      execute: async (input) => {
        try {
          await requireProjectPermission(ctx, "editor");

          const result = await executeBatchUpdateTasks(input, ctx);

          logActivity({
            context: ctx,
            toolName: "batchUpdateTasks",
            toolInput: input,
            toolOutput: {
              updatedCount: result.updatedCount,
              updatedTasks: result.updatedTasks,
              errors: result.errors,
            },
            status: "completed",
            requiresApproval: requireApproval,
            affectedTaskIds: result.affectedIds,
            snapshotBefore: {
              operation: "batchUpdate",
              entityType: "task",
              tasks: result.snapshotBefore,
            },
          });

          return {
            updatedCount: result.updatedCount,
            updatedTasks: result.updatedTasks,
            errors: result.errors,
          };
        } catch (error) {
          logFailure("batchUpdateTasks", input, error);
          throw error;
        }
      },
    }),

    batchDeleteTasks: tool({
      description: BATCH_DELETE_TASKS_DESCRIPTION,
      inputSchema: batchDeleteTasksSchema,
      needsApproval: requireApproval,
      execute: async (input) => {
        try {
          await requireProjectPermission(ctx, "editor");

          const result = await executeBatchDeleteTasks(input, ctx);

          logActivity({
            context: ctx,
            toolName: "batchDeleteTasks",
            toolInput: input,
            toolOutput: {
              deletedCount: result.deletedCount,
              deletedTasks: result.deletedTasks,
              errors: result.errors,
            },
            status: "completed",
            requiresApproval: requireApproval,
            affectedTaskIds: result.affectedIds,
            snapshotBefore: {
              operation: "batchDelete",
              entityType: "task",
              tasks: result.snapshotBefore,
            },
          });

          return {
            deletedCount: result.deletedCount,
            deletedTasks: result.deletedTasks,
            errors: result.errors,
          };
        } catch (error) {
          logFailure("batchDeleteTasks", input, error);
          throw error;
        }
      },
    }),
  };
}
