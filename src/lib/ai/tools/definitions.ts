import { toolDefinition } from "@tanstack/ai";
import { z } from "zod";

/**
 * Shared tool definitions for the Runa Agent.
 *
 * These define the schema (input/output) for each tool.
 * Server implementations are in ./server/.
 *
 * Phase 1: Read-only tools only.
 */

// ─────────────────────────────────────────────
// Read-Only Tools
// ─────────────────────────────────────────────

/**
 * Query tasks in the current project with optional filters.
 */
export const queryTasksDef = toolDefinition({
  name: "queryTasks",
  description:
    "Search and filter tasks in the current project. Use this to find tasks by keyword, assignee, label, priority, column/status, or to list all tasks. Always use this tool when the user asks about tasks on the board.",
  inputSchema: z.object({
    search: z
      .string()
      .optional()
      .describe("Search keyword to match against task titles"),
    columnId: z
      .string()
      .optional()
      .describe("Filter by column/status ID"),
    priority: z
      .enum(["none", "low", "medium", "high", "urgent"])
      .optional()
      .describe("Filter by priority level"),
    assigneeId: z
      .string()
      .optional()
      .describe("Filter by assignee user ID"),
    labelId: z
      .string()
      .optional()
      .describe("Filter by label ID"),
    limit: z
      .number()
      .optional()
      .default(50)
      .describe("Maximum number of tasks to return (default 50)"),
  }),
  outputSchema: z.object({
    tasks: z.array(
      z.object({
        id: z.string(),
        number: z.number().nullable(),
        title: z.string(),
        description: z.string(),
        priority: z.string(),
        columnId: z.string(),
        columnTitle: z.string(),
        dueDate: z.string().nullable(),
        assignees: z.array(
          z.object({
            id: z.string(),
            name: z.string(),
          }),
        ),
        labels: z.array(
          z.object({
            id: z.string(),
            name: z.string(),
            color: z.string(),
          }),
        ),
        createdAt: z.string(),
      }),
    ),
    totalCount: z.number(),
  }),
});

/**
 * Get full project details including columns, labels, and summary stats.
 */
export const queryProjectDef = toolDefinition({
  name: "queryProject",
  description:
    "Get details about the current project, including all columns (statuses), labels, and task counts per column. Use this when the user asks about the board structure, columns, or overall project state.",
  inputSchema: z.object({
    includeTaskCounts: z
      .boolean()
      .optional()
      .default(true)
      .describe("Include task count per column"),
  }),
  outputSchema: z.object({
    project: z.object({
      id: z.string(),
      name: z.string(),
      prefix: z.string().nullable(),
      description: z.string().nullable(),
      columns: z.array(
        z.object({
          id: z.string(),
          title: z.string(),
          icon: z.string().nullable(),
          index: z.number(),
          taskCount: z.number(),
        }),
      ),
      labels: z.array(
        z.object({
          id: z.string(),
          name: z.string(),
          color: z.string(),
          icon: z.string().nullable(),
        }),
      ),
      totalTasks: z.number(),
    }),
  }),
});

/**
 * Get a single task with full details (assignees, labels, comments).
 */
export const getTaskDef = toolDefinition({
  name: "getTask",
  description:
    "Get full details of a single task by its ID or task number. Use this when the user asks about a specific task (e.g., 'What is T-42?' or 'Show me task #5').",
  inputSchema: z.object({
    taskId: z
      .string()
      .optional()
      .describe("Task UUID (use this if you have the ID)"),
    taskNumber: z
      .number()
      .optional()
      .describe(
        "Task number within the project (use this when user refers to T-42 or #42)",
      ),
  }),
  outputSchema: z.object({
    task: z
      .object({
        id: z.string(),
        number: z.number().nullable(),
        title: z.string(),
        description: z.string(),
        priority: z.string(),
        columnId: z.string(),
        columnTitle: z.string(),
        dueDate: z.string().nullable(),
        assignees: z.array(
          z.object({
            id: z.string(),
            name: z.string(),
            email: z.string(),
          }),
        ),
        labels: z.array(
          z.object({
            id: z.string(),
            name: z.string(),
            color: z.string(),
          }),
        ),
        commentCount: z.number(),
        createdAt: z.string(),
        updatedAt: z.string(),
      })
      .nullable(),
  }),
});
