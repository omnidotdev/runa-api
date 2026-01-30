/**
 * Factory for creating write tools.
 *
 * Write tools require permission checks and activity logging.
 * Options allow skipping permission checks for trusted contexts.
 */

import { tool } from "ai";

import {
  addCommentSchema,
  addLabelSchema,
  assignTaskSchema,
  createColumnSchema,
  createTaskSchema,
  moveTaskSchema,
  removeLabelSchema,
  reorderColumnsSchema,
  reorderTasksSchema,
  updateColumnSchema,
  updateTaskSchema,
} from "../core/schemas";
import {
  ADD_COMMENT_DESCRIPTION,
  ADD_LABEL_DESCRIPTION,
  ASSIGN_TASK_DESCRIPTION,
  CREATE_COLUMN_DESCRIPTION,
  CREATE_TASK_DESCRIPTION,
  MOVE_TASK_DESCRIPTION,
  REMOVE_LABEL_DESCRIPTION,
  REORDER_COLUMNS_DESCRIPTION,
  REORDER_TASKS_DESCRIPTION,
  UPDATE_COLUMN_DESCRIPTION,
  UPDATE_TASK_DESCRIPTION,
  executeAddComment,
  executeAddLabel,
  executeAssignTask,
  executeCreateColumn,
  executeCreateTask,
  executeMoveTask,
  executeRemoveLabel,
  executeReorderColumns,
  executeReorderTasks,
  executeUpdateColumn,
  executeUpdateTask,
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
    createTask: tool({
      description: CREATE_TASK_DESCRIPTION,
      inputSchema: createTaskSchema,
      needsApproval: createTaskNeedsApproval,
      execute: async (input) => {
        try {
          if (!skipPermissionCheck) {
            await requireProjectPermission(ctx, "editor");
          }

          const result = await executeCreateTask(input, ctx, markdownToHtml);

          if (enableActivityLogging) {
            logActivity({
              context: ctx,
              toolName: "createTask",
              toolInput: input,
              toolOutput: result,
              status: "completed",
              affectedTaskIds: [result.task.id],
              snapshotBefore: {
                operation: "create",
                entityType: "task",
                entityId: result.task.id,
              },
            });
          }

          return result;
        } catch (error) {
          logFailure("createTask", input, error);
          throw error;
        }
      },
    }),

    updateTask: tool({
      description: UPDATE_TASK_DESCRIPTION,
      inputSchema: updateTaskSchema,
      execute: async (input) => {
        try {
          if (!skipPermissionCheck) {
            await requireProjectPermission(ctx, "editor");
          }

          const result = await executeUpdateTask(input, ctx, markdownToHtml);

          if (enableActivityLogging) {
            logActivity({
              context: ctx,
              toolName: "updateTask",
              toolInput: input,
              toolOutput: result,
              status: "completed",
              affectedTaskIds: [result.task.id],
              snapshotBefore: {
                operation: "update",
                entityType: "task",
                entityId: result.task.id,
                previousState: result.previousState,
              },
            });
          }

          return {
            task: result.task,
          };
        } catch (error) {
          logFailure("updateTask", input, error);
          throw error;
        }
      },
    }),

    moveTask: tool({
      description: MOVE_TASK_DESCRIPTION,
      inputSchema: moveTaskSchema,
      execute: async (input) => {
        try {
          if (!skipPermissionCheck) {
            await requireProjectPermission(ctx, "editor");
          }

          const result = await executeMoveTask(input, ctx);

          if (enableActivityLogging) {
            logActivity({
              context: ctx,
              toolName: "moveTask",
              toolInput: input,
              toolOutput: result,
              status: "completed",
              affectedTaskIds: [result.task.id],
              snapshotBefore: {
                operation: "move",
                entityType: "task",
                entityId: result.task.id,
                previousState: result.previousState,
              },
            });
          }

          return {
            task: result.task,
            fromColumn: result.fromColumn,
            toColumn: result.toColumn,
          };
        } catch (error) {
          logFailure("moveTask", input, error);
          throw error;
        }
      },
    }),

    assignTask: tool({
      description: ASSIGN_TASK_DESCRIPTION,
      inputSchema: assignTaskSchema,
      execute: async (input) => {
        try {
          if (!skipPermissionCheck) {
            await requireProjectPermission(ctx, "member");
          }

          const result = await executeAssignTask(input, ctx);

          if (enableActivityLogging) {
            logActivity({
              context: ctx,
              toolName: "assignTask",
              toolInput: input,
              toolOutput: result,
              status: "completed",
              affectedTaskIds: [result.taskId],
              snapshotBefore: {
                operation: input.action === "add" ? "assign" : "unassign",
                entityType: "assignee",
                entityId: result.taskId,
                previousState: { taskId: result.taskId, userId: input.userId },
              },
            });
          }

          return result;
        } catch (error) {
          logFailure("assignTask", input, error);
          throw error;
        }
      },
    }),

    addLabel: tool({
      description: ADD_LABEL_DESCRIPTION,
      inputSchema: addLabelSchema,
      execute: async (input) => {
        try {
          if (!skipPermissionCheck) {
            await requireProjectPermission(ctx, "member");
          }

          const result = await executeAddLabel(input, ctx);

          if (enableActivityLogging) {
            logActivity({
              context: ctx,
              toolName: "addLabel",
              toolInput: input,
              toolOutput: result,
              status: "completed",
              affectedTaskIds: [result.taskId],
              snapshotBefore: {
                operation: "addLabel",
                entityType: "taskLabel",
                entityId: result.taskId,
                previousState: {
                  taskId: result.taskId,
                  labelId: result.labelId,
                },
              },
            });
          }

          return result;
        } catch (error) {
          logFailure("addLabel", input, error);
          throw error;
        }
      },
    }),

    removeLabel: tool({
      description: REMOVE_LABEL_DESCRIPTION,
      inputSchema: removeLabelSchema,
      execute: async (input) => {
        try {
          if (!skipPermissionCheck) {
            await requireProjectPermission(ctx, "member");
          }

          const result = await executeRemoveLabel(input, ctx);

          if (enableActivityLogging) {
            logActivity({
              context: ctx,
              toolName: "removeLabel",
              toolInput: input,
              toolOutput: result,
              status: "completed",
              affectedTaskIds: [result.taskId],
              snapshotBefore: {
                operation: "removeLabel",
                entityType: "taskLabel",
                entityId: result.taskId,
                previousState: {
                  taskId: result.taskId,
                  labelId: result.labelId,
                },
              },
            });
          }

          return result;
        } catch (error) {
          logFailure("removeLabel", input, error);
          throw error;
        }
      },
    }),

    addComment: tool({
      description: ADD_COMMENT_DESCRIPTION,
      inputSchema: addCommentSchema,
      execute: async (input) => {
        try {
          if (!skipPermissionCheck) {
            await requireProjectPermission(ctx, "member");
          }

          const result = await executeAddComment(input, ctx);

          if (enableActivityLogging) {
            logActivity({
              context: ctx,
              toolName: "addComment",
              toolInput: input,
              toolOutput: result,
              status: "completed",
              affectedTaskIds: [result.taskId],
              snapshotBefore: {
                operation: "addComment",
                entityType: "comment",
                entityId: result.commentId,
              },
            });
          }

          return result;
        } catch (error) {
          logFailure("addComment", input, error);
          throw error;
        }
      },
    }),

    createColumn: tool({
      description: CREATE_COLUMN_DESCRIPTION,
      inputSchema: createColumnSchema,
      execute: async (input) => {
        try {
          if (!skipPermissionCheck) {
            await requireProjectPermission(ctx, "editor");
          }

          const result = await executeCreateColumn(input, ctx);

          if (enableActivityLogging) {
            logActivity({
              context: ctx,
              toolName: "createColumn",
              toolInput: input,
              toolOutput: result,
              status: "completed",
              snapshotBefore: {
                operation: "createColumn",
                entityType: "column",
                entityId: result.column.id,
              },
            });
          }

          return result;
        } catch (error) {
          logFailure("createColumn", input, error);
          throw error;
        }
      },
    }),

    updateColumn: tool({
      description: UPDATE_COLUMN_DESCRIPTION,
      inputSchema: updateColumnSchema,
      execute: async (input) => {
        try {
          if (!skipPermissionCheck) {
            await requireProjectPermission(ctx, "editor");
          }

          const result = await executeUpdateColumn(input, ctx);

          if (enableActivityLogging) {
            logActivity({
              context: ctx,
              toolName: "updateColumn",
              toolInput: input,
              toolOutput: { column: result.column },
              status: "completed",
              snapshotBefore: {
                operation: "updateColumn",
                entityType: "column",
                entityId: input.columnId,
                previousState: result.previousState,
              },
            });
          }

          return { column: result.column };
        } catch (error) {
          logFailure("updateColumn", input, error);
          throw error;
        }
      },
    }),

    reorderColumns: tool({
      description: REORDER_COLUMNS_DESCRIPTION,
      inputSchema: reorderColumnsSchema,
      execute: async (input) => {
        try {
          if (!skipPermissionCheck) {
            await requireProjectPermission(ctx, "editor");
          }

          const result = await executeReorderColumns(input, ctx);

          if (enableActivityLogging) {
            logActivity({
              context: ctx,
              toolName: "reorderColumns",
              toolInput: input,
              toolOutput: { columns: result.columns },
              status: "completed",
              snapshotBefore: {
                operation: "reorderColumns",
                entityType: "column",
                previousOrder: result.previousOrder,
              },
            });
          }

          return { columns: result.columns };
        } catch (error) {
          logFailure("reorderColumns", input, error);
          throw error;
        }
      },
    }),

    reorderTasks: tool({
      description: REORDER_TASKS_DESCRIPTION,
      inputSchema: reorderTasksSchema,
      execute: async (input) => {
        try {
          if (!skipPermissionCheck) {
            await requireProjectPermission(ctx, "editor");
          }

          const result = await executeReorderTasks(input, ctx);

          if (enableActivityLogging) {
            logActivity({
              context: ctx,
              toolName: "reorderTasks",
              toolInput: input,
              toolOutput: { tasks: result.tasks, columnId: result.columnId },
              status: "completed",
              snapshotBefore: {
                operation: "reorderTasks",
                entityType: "task",
                columnId: result.columnId,
                previousOrder: result.previousOrder,
              },
            });
          }

          return { tasks: result.tasks, columnId: result.columnId };
        } catch (error) {
          logFailure("reorderTasks", input, error);
          throw error;
        }
      },
    }),
  };
}
