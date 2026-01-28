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
 * Phase 3: Destructive/batch tools (delete, batch move/update/delete).
 */

// ─────────────────────────────────────────────
// Dynamic Approval Helper
// ─────────────────────────────────────────────

/**
 * Re-create a tool definition with dynamic `needsApproval`.
 *
 * TanStack AI bakes `needsApproval` into the definition at construction time.
 * Since approval is configurable per-organization, we reconstruct the definition
 * at request time when the org config is available.
 *
 * @param def - The base tool definition (without needsApproval)
 * @param needsApproval - Whether to enable approval gating
 * @returns A new tool definition with needsApproval set, or the original if false
 */
export function withApproval<TDef extends ReturnType<typeof toolDefinition>>(
  def: TDef,
  needsApproval: boolean,
): TDef {
  if (!needsApproval) return def;

  return toolDefinition({
    name: def.name,
    description: def.description,
    inputSchema: def.inputSchema,
    outputSchema: def.outputSchema,
    needsApproval: true,
  }) as unknown as TDef;
}

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
      .uuid()
      .optional()
      .describe("Filter by column/status ID"),
    priority: z
      .enum(["none", "low", "medium", "high", "urgent"])
      .optional()
      .describe("Filter by priority level"),
    assigneeId: z
      .string()
      .uuid()
      .optional()
      .describe("Filter by assignee user ID"),
    labelId: z.string().uuid().optional().describe("Filter by label ID"),
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
      .uuid()
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
    columnId: z.string().uuid().describe("Column ID to place the task in"),
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
      .uuid()
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
      .uuid()
      .optional()
      .describe("Task UUID (use if you have the ID)"),
    taskNumber: z
      .number()
      .optional()
      .describe("Task number (use when user refers to T-42 or #42)"),
    columnId: z
      .string()
      .uuid()
      .describe("Target column ID to move the task to"),
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
      .uuid()
      .optional()
      .describe("Task UUID (use if you have the ID)"),
    taskNumber: z
      .number()
      .optional()
      .describe("Task number (use when user refers to T-42 or #42)"),
    userId: z.string().uuid().describe("User ID to assign or unassign"),
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
 * Supports referencing labels by ID or by name. Can optionally create new labels.
 */
export const addLabelDef = toolDefinition({
  name: "addLabel",
  description:
    "Add a label to a task. You can reference the label by ID or by name. If the label doesn't exist and createIfMissing is false (default), an error is returned so you can ask the user if they want to create it. If createIfMissing is true, a new project label will be created.",
  inputSchema: z.object({
    taskId: z
      .string()
      .uuid()
      .optional()
      .describe("Task UUID (use if you have the ID)"),
    taskNumber: z
      .number()
      .optional()
      .describe("Task number (use when user refers to T-42 or #42)"),
    labelId: z
      .string()
      .uuid()
      .optional()
      .describe(
        "Label ID to add (use if you have the exact ID from queryProject)",
      ),
    labelName: z
      .string()
      .optional()
      .describe(
        "Label name to add. The tool will search for an existing label with this name in the project or organization.",
      ),
    createIfMissing: z
      .boolean()
      .optional()
      .default(false)
      .describe(
        "If true and the label doesn't exist, create a new project label. If false (default), return an error when label is not found so you can confirm with the user first.",
      ),
    labelColor: z
      .string()
      .optional()
      .default("blue")
      .describe(
        "Color for new label (only used when createIfMissing is true). Options: gray, red, orange, yellow, green, blue, purple, pink.",
      ),
  }),
  outputSchema: z.object({
    taskId: z.string(),
    taskNumber: z.number().nullable(),
    taskTitle: z.string(),
    labelId: z.string(),
    labelName: z.string(),
    labelCreated: z.boolean().describe("Whether a new label was created"),
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
      .uuid()
      .optional()
      .describe("Task UUID (use if you have the ID)"),
    taskNumber: z
      .number()
      .optional()
      .describe("Task number (use when user refers to T-42 or #42)"),
    labelId: z.string().uuid().describe("Label ID to remove"),
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
      .uuid()
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

// ─────────────────────────────────────────────
// Delegation Tools
// ─────────────────────────────────────────────

/**
 * Delegate a subtask to another agent persona.
 * The delegate runs in its own context and returns a text response.
 */
export const delegateToAgentDef = toolDefinition({
  name: "delegateToAgent",
  description:
    "Delegate a subtask to another agent persona. The delegate persona runs independently and returns its response. Use this when a specialized persona would handle part of the task better (e.g., delegating triage to a triage-focused persona). The delegate has the same project access and query/write tools as you, but cannot perform destructive or batch operations (delete, batch move/update/delete).",
  inputSchema: z.object({
    personaId: z
      .string()
      .uuid()
      .describe("ID of the agent persona to delegate to"),
    instruction: z
      .string()
      .min(1)
      .max(2000)
      .describe(
        "The instruction or question for the delegate agent. Be specific about what you need.",
      ),
  }),
  outputSchema: z.object({
    personaName: z.string(),
    response: z.string().max(4000),
  }),
});

// ─────────────────────────────────────────────
// Destructive & Batch Tools
// ─────────────────────────────────────────────

/** Shared schema for identifying a task by ID or number. */
const taskRefSchema = z.object({
  taskId: z
    .string()
    .uuid()
    .optional()
    .describe("Task UUID (use if you have the ID)"),
  taskNumber: z
    .number()
    .optional()
    .describe("Task number (use when user refers to T-42 or #42)"),
});

/**
 * Delete a single task from the project.
 * needsApproval is injected dynamically via withApproval().
 */
export const deleteTaskDef = toolDefinition({
  name: "deleteTask",
  description:
    "Permanently delete a task from the project. This cannot be undone. Provide the task ID or task number.",
  inputSchema: taskRefSchema,
  outputSchema: z.object({
    deletedTaskId: z.string(),
    deletedTaskNumber: z.number().nullable(),
    deletedTaskTitle: z.string(),
  }),
});

/**
 * Batch move multiple tasks to a target column.
 * needsApproval is injected dynamically via withApproval().
 */
export const batchMoveTasksDef = toolDefinition({
  name: "batchMoveTasks",
  description:
    "Move multiple tasks to a target column (status) in one operation. List the tasks to move and the destination column. Use this for bulk status changes like 'move all urgent tasks to Done'.",
  inputSchema: z.object({
    tasks: z
      .array(taskRefSchema)
      .min(1)
      .max(50)
      .describe("Tasks to move (1-50)"),
    columnId: z
      .string()
      .uuid()
      .describe("Target column ID to move all tasks to"),
  }),
  outputSchema: z.object({
    movedCount: z.number(),
    targetColumn: z.string(),
    movedTasks: z.array(
      z.object({
        id: z.string(),
        number: z.number().nullable(),
        title: z.string(),
        fromColumn: z.string(),
      }),
    ),
    errors: z.array(
      z.object({
        ref: z.string(),
        message: z.string(),
      }),
    ),
  }),
});

/**
 * Batch update fields on multiple tasks.
 * needsApproval is injected dynamically via withApproval().
 */
export const batchUpdateTasksDef = toolDefinition({
  name: "batchUpdateTasks",
  description:
    "Update fields on multiple tasks at once. Provide the tasks and the fields to change (priority, dueDate). Use this for bulk updates like 'set all backlog tasks to low priority'.",
  inputSchema: z.object({
    tasks: z
      .array(taskRefSchema)
      .min(1)
      .max(50)
      .describe("Tasks to update (1-50)"),
    priority: z
      .enum(["none", "low", "medium", "high", "urgent"])
      .optional()
      .describe("New priority level for all tasks"),
    dueDate: z
      .string()
      .datetime()
      .nullable()
      .optional()
      .describe(
        "New due date in ISO 8601 format for all tasks, or null to clear",
      ),
  }),
  outputSchema: z.object({
    updatedCount: z.number(),
    updatedTasks: z.array(
      z.object({
        id: z.string(),
        number: z.number().nullable(),
        title: z.string(),
      }),
    ),
    errors: z.array(
      z.object({
        ref: z.string(),
        message: z.string(),
      }),
    ),
  }),
});

/**
 * Batch delete multiple tasks.
 * needsApproval is injected dynamically via withApproval().
 */
export const batchDeleteTasksDef = toolDefinition({
  name: "batchDeleteTasks",
  description:
    "Permanently delete multiple tasks from the project in one operation. This cannot be undone. Use this for bulk cleanup like 'delete all completed tasks'.",
  inputSchema: z.object({
    tasks: z
      .array(taskRefSchema)
      .min(1)
      .max(50)
      .describe("Tasks to delete (1-50)"),
  }),
  outputSchema: z.object({
    deletedCount: z.number(),
    deletedTasks: z.array(
      z.object({
        id: z.string(),
        number: z.number().nullable(),
        title: z.string(),
      }),
    ),
    errors: z.array(
      z.object({
        ref: z.string(),
        message: z.string(),
      }),
    ),
  }),
});

// ─────────────────────────────────────────────
// Project Creation Tools
// ─────────────────────────────────────────────

/** Shared schema for column definition in proposals. */
const proposedColumnSchema = z.object({
  title: z.string().min(1).max(50).describe("Column title/status name"),
  icon: z
    .string()
    .optional()
    .describe("Emoji icon for the column (e.g., '📋', '🚀', '✅')"),
});

/** Shared schema for label definition in proposals. */
const proposedLabelSchema = z.object({
  name: z.string().min(1).max(50).describe("Label name"),
  color: z
    .enum([
      "gray",
      "red",
      "orange",
      "yellow",
      "green",
      "blue",
      "purple",
      "pink",
    ])
    .describe("Label color"),
});

/** Shared schema for initial task definition in proposals. */
const proposedTaskSchema = z.object({
  title: z.string().min(1).max(200).describe("Task title"),
  columnIndex: z
    .number()
    .int()
    .min(0)
    .describe("Index of the column to place this task in (0-based)"),
  priority: z
    .enum(["none", "low", "medium", "high", "urgent"])
    .optional()
    .describe("Task priority level"),
  description: z.string().optional().describe("Task description (markdown)"),
  labelNames: z
    .array(z.string())
    .optional()
    .describe(
      "Names of labels to assign to this task (must match labels defined in the proposal)",
    ),
});

/**
 * Propose a project structure for user review.
 *
 * Use this tool after gathering context through discovery questions.
 * The proposal is stored and can be executed with createProjectFromProposal.
 */
export const proposeProjectDef = toolDefinition({
  name: "proposeProject",
  description:
    "Present a project proposal to the user for review. Use this after gathering enough context through discovery questions. The user will see the proposed structure and can approve, request changes, or reject. Do not call this until you have enough information about the project.",
  inputSchema: z.object({
    name: z
      .string()
      .min(3)
      .max(100)
      .describe("Project name (e.g., 'Marketing Campaign Q1')"),
    prefix: z
      .string()
      .min(1)
      .max(10)
      .transform((s) => s.toUpperCase().replace(/[^A-Z0-9]/g, ""))
      .describe(
        "Task prefix for numbering (e.g., 'MKT' for MKT-1, MKT-2). Letters/numbers only, auto-uppercased.",
      ),
    description: z
      .string()
      .max(500)
      .optional()
      .describe("Brief project description"),
    columns: z
      .array(proposedColumnSchema)
      .min(2)
      .max(10)
      .describe(
        "Board columns representing workflow stages. Order matters (left to right on board).",
      ),
    labels: z
      .array(proposedLabelSchema)
      .max(10)
      .optional()
      .describe("Optional labels for categorizing tasks"),
    initialTasks: z
      .array(proposedTaskSchema)
      .max(20)
      .optional()
      .describe("Optional initial tasks to pre-populate the board"),
  }),
  outputSchema: z.object({
    proposalId: z.string().describe("Unique ID to reference this proposal"),
    status: z.enum(["pending_review"]),
    summary: z.string().describe("Human-readable summary of the proposal"),
  }),
});

/**
 * Create a project from an approved proposal.
 *
 * This tool requires explicit user approval before execution.
 * It creates the project, columns, labels, and initial tasks atomically.
 */
export const createProjectFromProposalDef = toolDefinition({
  name: "createProjectFromProposal",
  description:
    "Create the project from a proposal after the user has approved it. Only call this when the user explicitly confirms they want to create the project. This operation requires approval and will create the project with all columns, labels, and initial tasks atomically.",
  inputSchema: z.object({
    proposalId: z
      .string()
      .describe("The proposal ID from proposeProject to execute"),
  }),
  outputSchema: z.object({
    project: z.object({
      id: z.string(),
      name: z.string(),
      slug: z.string(),
      prefix: z.string(),
    }),
    columnsCreated: z.number(),
    labelsCreated: z.number(),
    tasksCreated: z.number(),
    boardUrl: z.string().describe("Relative URL to the new project board"),
  }),
  needsApproval: true,
});
