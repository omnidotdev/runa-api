/**
 * Factory for creating write tools.
 *
 * Write tools require permission checks and activity logging.
 * Options allow skipping permission checks for trusted contexts.
 *
 * Consolidated tool set:
 * - Task: createTasks, updateTasks
 * - Column: createColumns, updateColumns
 * - Comment: createComments
 */

import { tool } from "ai";

import {
  createColumnsSchema,
  createCommentsSchema,
  createTasksSchema,
  updateColumnsSchema,
  updateTasksSchema,
} from "../core/schemas";
import {
  CREATE_COLUMNS_DESCRIPTION,
  CREATE_COMMENTS_DESCRIPTION,
  CREATE_TASKS_DESCRIPTION,
  UPDATE_COLUMNS_DESCRIPTION,
  UPDATE_TASKS_DESCRIPTION,
  executeCreateColumns,
  executeCreateComments,
  executeCreateTasks,
  executeUpdateColumns,
  executeUpdateTasks,
} from "../definitions/write";
import { logActivity } from "../wrappers/withActivityLogging";
import { requireProjectPermission } from "../wrappers/withPermission";

import type { WriteToolContext } from "../core/context";
import type { MarkdownToHtmlFn } from "../definitions/write";
import type { WriteToolsOptions } from "../types";

export interface WriteToolsFactoryOptions extends WriteToolsOptions {
  /** Markdown to HTML converter for descriptions. */
  markdownToHtml?: MarkdownToHtmlFn;
}

export function createWriteTools(
  ctx: WriteToolContext,
  options: WriteToolsFactoryOptions = {},
) {
  const {
    skipPermissionCheck = false,
    enableActivityLogging = true,
    createTaskNeedsApproval = false,
    markdownToHtml,
  } = options;

  /** Log a failed tool execution for audit trail. */
  const logFailure = (toolName: string, input: unknown, error: unknown) => {
    if (enableActivityLogging) {
      logActivity({
        context: ctx,
        toolName,
        toolInput: input,
        status: "failed",
        errorMessage: error instanceof Error ? error.message : String(error),
      });
    }
  };

  return {
    createTasks: tool({
      description: CREATE_TASKS_DESCRIPTION,
      inputSchema: createTasksSchema,
      needsApproval: createTaskNeedsApproval,
      execute: async (input) => {
        try {
          if (!skipPermissionCheck) {
            await requireProjectPermission(ctx, "editor");
          }

          const result = await executeCreateTasks(input, ctx, markdownToHtml);

          if (enableActivityLogging) {
            logActivity({
              context: ctx,
              toolName: "createTasks",
              toolInput: input,
              toolOutput: result,
              status: "completed",
              affectedTaskIds: result.affectedIds,
              snapshotBefore: {
                operation: "create",
                entityType: "task",
                count: result.createdCount,
              },
            });
          }

          return result;
        } catch (error) {
          logFailure("createTasks", input, error);
          throw error;
        }
      },
    }),

    updateTasks: tool({
      description: UPDATE_TASKS_DESCRIPTION,
      inputSchema: updateTasksSchema,
      execute: async (input) => {
        try {
          if (!skipPermissionCheck) {
            await requireProjectPermission(ctx, "editor");
          }

          const result = await executeUpdateTasks(input, ctx, markdownToHtml);

          if (enableActivityLogging) {
            logActivity({
              context: ctx,
              toolName: "updateTasks",
              toolInput: input,
              toolOutput: result,
              status: "completed",
              affectedTaskIds: result.affectedIds,
              snapshotBefore: {
                operation: "update",
                entityType: "task",
                tasks: result.snapshotBefore,
              },
            });
          }

          return {
            updatedCount: result.updatedCount,
            tasks: result.tasks,
          };
        } catch (error) {
          logFailure("updateTasks", input, error);
          throw error;
        }
      },
    }),

    createColumns: tool({
      description: CREATE_COLUMNS_DESCRIPTION,
      inputSchema: createColumnsSchema,
      execute: async (input) => {
        try {
          if (!skipPermissionCheck) {
            await requireProjectPermission(ctx, "editor");
          }

          const result = await executeCreateColumns(input, ctx);

          if (enableActivityLogging) {
            logActivity({
              context: ctx,
              toolName: "createColumns",
              toolInput: input,
              toolOutput: result,
              status: "completed",
              snapshotBefore: {
                operation: "create",
                entityType: "column",
                count: result.createdCount,
              },
            });
          }

          return result;
        } catch (error) {
          logFailure("createColumns", input, error);
          throw error;
        }
      },
    }),

    updateColumns: tool({
      description: UPDATE_COLUMNS_DESCRIPTION,
      inputSchema: updateColumnsSchema,
      execute: async (input) => {
        try {
          if (!skipPermissionCheck) {
            await requireProjectPermission(ctx, "editor");
          }

          const result = await executeUpdateColumns(input, ctx);

          if (enableActivityLogging) {
            logActivity({
              context: ctx,
              toolName: "updateColumns",
              toolInput: input,
              toolOutput: { columns: result.columns },
              status: "completed",
              snapshotBefore: {
                operation: "update",
                entityType: "column",
                columns: result.snapshotBefore,
              },
            });
          }

          return { columns: result.columns };
        } catch (error) {
          logFailure("updateColumns", input, error);
          throw error;
        }
      },
    }),

    createComments: tool({
      description: CREATE_COMMENTS_DESCRIPTION,
      inputSchema: createCommentsSchema,
      execute: async (input) => {
        try {
          if (!skipPermissionCheck) {
            await requireProjectPermission(ctx, "member");
          }

          const result = await executeCreateComments(input, ctx);

          if (enableActivityLogging) {
            logActivity({
              context: ctx,
              toolName: "createComments",
              toolInput: input,
              toolOutput: result,
              status: "completed",
              affectedTaskIds: result.affectedIds,
              snapshotBefore: {
                operation: "create",
                entityType: "comment",
                count: result.count,
              },
            });
          }

          return result;
        } catch (error) {
          logFailure("createComments", input, error);
          throw error;
        }
      },
    }),
  };
}
