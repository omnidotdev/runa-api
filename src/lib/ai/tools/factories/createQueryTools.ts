/**
 * Factory for creating query tools.
 *
 * Query tools are read-only and don't require permission checks or activity logging.
 */

import { tool } from "ai";

import {
  getTaskSchema,
  queryProjectSchema,
  queryTasksSchema,
} from "../core/schemas";
import {
  GET_TASK_DESCRIPTION,
  QUERY_PROJECT_DESCRIPTION,
  QUERY_TASKS_DESCRIPTION,
  executeGetTask,
  executeQueryProject,
  executeQueryTasks,
} from "../definitions/query";

import type { ToolContext } from "../core/context";

export function createQueryTools(ctx: ToolContext) {
  return {
    queryTasks: tool({
      description: QUERY_TASKS_DESCRIPTION,
      inputSchema: queryTasksSchema,
      execute: (input) => executeQueryTasks(input, ctx),
    }),

    queryProject: tool({
      description: QUERY_PROJECT_DESCRIPTION,
      inputSchema: queryProjectSchema,
      execute: (input) => executeQueryProject(input, ctx),
    }),

    getTask: tool({
      description: GET_TASK_DESCRIPTION,
      inputSchema: getTaskSchema,
      execute: (input) => executeGetTask(input, ctx),
    }),
  };
}
