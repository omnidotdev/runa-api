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
 *
 * Consolidated tool set:
 * - Task: deleteTasks
 * - Column: deleteColumns
 */

import { tool } from "ai";

import { deleteColumnsSchema, deleteTasksSchema } from "../core/schemas";
import {
  DELETE_COLUMNS_DESCRIPTION,
  DELETE_TASKS_DESCRIPTION,
  executeDeleteColumns,
  executeDeleteTasks,
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
    deleteTasks: tool({
      description: DELETE_TASKS_DESCRIPTION,
      inputSchema: deleteTasksSchema,
      needsApproval: requireApproval,
      execute: async (input) => {
        try {
          await requireProjectPermission(ctx, "editor");

          const result = await executeDeleteTasks(input, ctx);

          logActivity({
            context: ctx,
            toolName: "deleteTasks",
            toolInput: input,
            toolOutput: {
              deletedCount: result.deletedCount,
              deletedTasks: result.deletedTasks,
            },
            status: "completed",
            requiresApproval: requireApproval,
            affectedTaskIds: result.affectedIds,
            snapshotBefore: {
              operation: "delete",
              entityType: "task",
              tasks: result.snapshotBefore,
            },
          });

          return {
            deletedCount: result.deletedCount,
            deletedTasks: result.deletedTasks,
          };
        } catch (error) {
          logFailure("deleteTasks", input, error);
          throw error;
        }
      },
    }),

    deleteColumns: tool({
      description: DELETE_COLUMNS_DESCRIPTION,
      inputSchema: deleteColumnsSchema,
      needsApproval: requireApproval,
      execute: async (input) => {
        try {
          await requireProjectPermission(ctx, "editor");

          const result = await executeDeleteColumns(input, ctx);

          logActivity({
            context: ctx,
            toolName: "deleteColumns",
            toolInput: input,
            toolOutput: {
              deletedCount: result.deletedCount,
              columns: result.columns,
            },
            status: "completed",
            requiresApproval: requireApproval,
            snapshotBefore: {
              operation: "delete",
              entityType: "column",
              columns: result.snapshotBefore,
            },
          });

          return {
            deletedCount: result.deletedCount,
            columns: result.columns,
          };
        } catch (error) {
          logFailure("deleteColumns", input, error);
          throw error;
        }
      },
    }),
  };
}
