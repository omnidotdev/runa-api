import { toolDefinition } from "@tanstack/ai";
import { z } from "zod";

/**
 * Shared tool definitions for the Runa Agent.
 *
 * These define the schema (input/output) for each tool.
 * Server implementations are in ./server/.
 *
 * Phase 1: Read-only tools.
 * Phase 2: Write tools (create, update, move, assign, label, comment).
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

// ─────────────────────────────────────────────
// Write Tools
// ─────────────────────────────────────────────

/**
 * Create a new task in the project.
 */
export const createTaskDef = toolDefinition({
  name: "createTask",
  description:
    "Create a new task in the current project. Requires a title and the column (status) to place it in. Optionally set priority, description, and due date.",
  inputSchema: z.object({
    title: z.string().describe("Task title"),
    columnId: z.string().describe("Column ID to place the task in"),
    description: z
      .string()
      .optional()
      .describe("Task description (defaults to empty)"),
    priority: z
      .enum(["none", "low", "medium", "high", "urgent"])
      .optional()
      .describe("Priority level (defaults to medium)"),
    dueDate: z
      .string()
      .datetime()
      .optional()
      .describe("Due date in ISO 8601 format (e.g., 2025-03-15T00:00:00Z)"),
  }),
  outputSchema: z.object({
    task: z.object({
      id: z.string(),
      number: z.number().nullable(),
      title: z.string(),
      columnId: z.string(),
      columnTitle: z.string(),
      priority: z.string(),
    }),
  }),
});

/**
 * Update an existing task's fields.
 */
export const updateTaskDef = toolDefinition({
  name: "updateTask",
  description:
    "Update a task's title, description, priority, or due date. Provide the task ID or task number and the fields to change. Set dueDate to null to clear it.",
  inputSchema: z.object({
    taskId: z
      .string()
      .optional()
      .describe("Task UUID (use if you have the ID)"),
    taskNumber: z
      .number()
      .optional()
      .describe("Task number (use when user refers to T-42 or #42)"),
    title: z.string().optional().describe("New task title"),
    description: z.string().optional().describe("New task description"),
    priority: z
      .enum(["none", "low", "medium", "high", "urgent"])
      .optional()
      .describe("New priority level"),
    dueDate: z
      .string()
      .datetime()
      .nullable()
      .optional()
      .describe(
        "New due date in ISO 8601 format, or null to clear the due date",
      ),
  }),
  outputSchema: z.object({
    task: z.object({
      id: z.string(),
      number: z.number().nullable(),
      title: z.string(),
      priority: z.string(),
      dueDate: z.string().nullable(),
    }),
  }),
});

/**
 * Move a task to a different column (status).
 */
export const moveTaskDef = toolDefinition({
  name: "moveTask",
  description:
    "Move a task to a different column (status) on the board. Provide the task and the target column.",
  inputSchema: z.object({
    taskId: z
      .string()
      .optional()
      .describe("Task UUID (use if you have the ID)"),
    taskNumber: z
      .number()
      .optional()
      .describe("Task number (use when user refers to T-42 or #42)"),
    columnId: z.string().describe("Target column ID to move the task to"),
  }),
  outputSchema: z.object({
    task: z.object({
      id: z.string(),
      number: z.number().nullable(),
      title: z.string(),
    }),
    fromColumn: z.string(),
    toColumn: z.string(),
  }),
});

/**
 * Add or remove an assignee on a task.
 */
export const assignTaskDef = toolDefinition({
  name: "assignTask",
  description:
    "Add or remove an assignee on a task. Use action 'add' to assign someone, 'remove' to unassign.",
  inputSchema: z.object({
    taskId: z
      .string()
      .optional()
      .describe("Task UUID (use if you have the ID)"),
    taskNumber: z
      .number()
      .optional()
      .describe("Task number (use when user refers to T-42 or #42)"),
    userId: z.string().describe("User ID to assign or unassign"),
    action: z
      .enum(["add", "remove"])
      .describe("Whether to add or remove the assignee"),
  }),
  outputSchema: z.object({
    taskId: z.string(),
    taskNumber: z.number().nullable(),
    taskTitle: z.string(),
    userId: z.string(),
    userName: z.string(),
    action: z.enum(["add", "remove"]),
  }),
});

/**
 * Add a label to a task.
 */
export const addLabelDef = toolDefinition({
  name: "addLabel",
  description:
    "Add a label to a task. The label must already exist in the project or organization.",
  inputSchema: z.object({
    taskId: z
      .string()
      .optional()
      .describe("Task UUID (use if you have the ID)"),
    taskNumber: z
      .number()
      .optional()
      .describe("Task number (use when user refers to T-42 or #42)"),
    labelId: z.string().describe("Label ID to add"),
  }),
  outputSchema: z.object({
    taskId: z.string(),
    taskNumber: z.number().nullable(),
    taskTitle: z.string(),
    labelId: z.string(),
    labelName: z.string(),
  }),
});

/**
 * Remove a label from a task.
 */
export const removeLabelDef = toolDefinition({
  name: "removeLabel",
  description: "Remove a label from a task.",
  inputSchema: z.object({
    taskId: z
      .string()
      .optional()
      .describe("Task UUID (use if you have the ID)"),
    taskNumber: z
      .number()
      .optional()
      .describe("Task number (use when user refers to T-42 or #42)"),
    labelId: z.string().describe("Label ID to remove"),
  }),
  outputSchema: z.object({
    taskId: z.string(),
    taskNumber: z.number().nullable(),
    taskTitle: z.string(),
    labelId: z.string(),
    labelName: z.string(),
  }),
});

/**
 * Add a comment to a task.
 */
export const addCommentDef = toolDefinition({
  name: "addComment",
  description:
    "Add a comment to a task. The comment will be attributed to the current user.",
  inputSchema: z.object({
    taskId: z
      .string()
      .optional()
      .describe("Task UUID (use if you have the ID)"),
    taskNumber: z
      .number()
      .optional()
      .describe("Task number (use when user refers to T-42 or #42)"),
    content: z.string().describe("Comment text"),
  }),
  outputSchema: z.object({
    commentId: z.string(),
    taskId: z.string(),
    taskNumber: z.number().nullable(),
    taskTitle: z.string(),
  }),
});
