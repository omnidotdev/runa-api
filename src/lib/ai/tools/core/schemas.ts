/**
 * Shared Zod schemas for AI agent tool inputs.
 *
 * Single source of truth for all tool input validation.
 *
 * All tools use unified array-based schemas where:
 * - Single operations = array of 1
 * - Batch operations = array of N (max 50)
 *
 * Consolidated tool set:
 * - Task: createTasks, updateTasks, deleteTasks
 * - Column: createColumns, updateColumns, deleteColumns
 * - Comment: createComments
 */

import { z } from "zod";

// ─────────────────────────────────────────────
// Shared Field Schemas
// ─────────────────────────────────────────────

const taskIdSchema = z.string().uuid().optional().describe("Task UUID");
const taskNumberSchema = z
  .number()
  .optional()
  .describe("Task number (e.g., 42 for T-42)");

/** Task reference - either by ID or project-scoped number. */
const taskRefSchema = z
  .object({
    taskId: taskIdSchema,
    taskNumber: taskNumberSchema,
  })
  .describe("Task reference by ID or number");

const prioritySchema = z
  .enum(["none", "low", "medium", "high", "urgent"])
  .describe("Priority level");

const dueDateSchema = z
  .string()
  .datetime()
  .nullable()
  .optional()
  .describe("Due date in ISO 8601 format");

// ─────────────────────────────────────────────
// Query Tool Schemas
// ─────────────────────────────────────────────

export const queryTasksSchema = z.object({
  search: z
    .string()
    .optional()
    .describe("Search keyword to match against task titles"),
  columnId: z.string().uuid().optional().describe("Filter by column/status ID"),
  priority: prioritySchema.optional().describe("Filter by priority level"),
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
    .describe("Maximum number of tasks to return"),
});

export const queryProjectSchema = z.object({
  includeTaskCounts: z
    .boolean()
    .optional()
    .default(true)
    .describe("Include task count per column"),
});

export const getTaskSchema = z.object({
  taskId: taskIdSchema,
  taskNumber: taskNumberSchema,
});

// ─────────────────────────────────────────────
// Task Tool Schemas
// ─────────────────────────────────────────────

/** Single task creation item. */
const createTaskItemSchema = z.object({
  title: z.string().describe("Task title"),
  columnId: z.string().uuid().describe("Column ID to place the task in"),
  description: z.string().optional().describe("Task description (markdown)"),
  priority: prioritySchema.optional().describe("Priority level"),
  dueDate: z
    .string()
    .datetime()
    .optional()
    .describe("Due date in ISO 8601 format"),
});

export const createTasksSchema = z.object({
  tasks: z
    .array(createTaskItemSchema)
    .min(1)
    .max(50)
    .describe("Tasks to create (1-50)"),
});

/** Label reference for add operations. */
const labelAddSchema = z.object({
  labelId: z.string().uuid().optional().describe("Label ID"),
  labelName: z.string().optional().describe("Label name (if ID not provided)"),
  createIfMissing: z
    .boolean()
    .optional()
    .default(false)
    .describe("Create label if not found"),
  labelColor: z
    .string()
    .optional()
    .default("blue")
    .describe("Color for new label"),
});

/** Assignee operations for a task update. */
const assigneeOpsSchema = z
  .object({
    add: z
      .array(z.string().uuid())
      .optional()
      .describe("User IDs to add as assignees"),
    remove: z
      .array(z.string().uuid())
      .optional()
      .describe("User IDs to remove as assignees"),
    set: z
      .array(z.string().uuid())
      .optional()
      .describe("Replace all assignees with these user IDs"),
  })
  .describe("Assignee operations");

/** Label operations for a task update. */
const labelOpsSchema = z
  .object({
    add: z
      .array(labelAddSchema)
      .optional()
      .describe("Labels to add (by ID or name)"),
    remove: z
      .array(z.string().uuid())
      .optional()
      .describe("Label IDs to remove"),
    set: z
      .array(z.string().uuid())
      .optional()
      .describe("Replace all labels with these label IDs"),
  })
  .describe("Label operations");

/**
 * Single task update item.
 *
 * Unified schema supporting:
 * - Field updates (title, description, priority, dueDate)
 * - Move to column (columnId)
 * - Reorder within column (columnIndex)
 * - Assignee management (assignees.add/remove/set)
 * - Label management (labels.add/remove/set)
 */
const updateTaskItemSchema = z.object({
  // Task reference (required)
  taskId: taskIdSchema,
  taskNumber: taskNumberSchema,

  // Field updates
  title: z.string().optional().describe("New task title"),
  description: z
    .string()
    .optional()
    .describe("New task description (markdown)"),
  priority: prioritySchema.optional().describe("New priority level"),
  dueDate: dueDateSchema.describe("New due date or null to clear"),

  // Move operations
  columnId: z.string().uuid().optional().describe("Move task to this column"),
  columnIndex: z
    .number()
    .int()
    .min(0)
    .optional()
    .describe("New position within column (0-indexed)"),

  // Relationship operations
  assignees: assigneeOpsSchema.optional(),
  labels: labelOpsSchema.optional(),
});

export const updateTasksSchema = z.object({
  updates: z
    .array(updateTaskItemSchema)
    .min(1)
    .max(50)
    .describe("Task updates to apply (1-50)"),
});

export const deleteTasksSchema = z.object({
  tasks: z
    .array(taskRefSchema)
    .min(1)
    .max(50)
    .describe("Tasks to delete (1-50)"),
});

// ─────────────────────────────────────────────
// Column Tool Schemas
// ─────────────────────────────────────────────

/** Single column creation item. */
const createColumnItemSchema = z.object({
  title: z.string().min(1).max(50).describe("Column title"),
  icon: z.string().optional().describe("Emoji icon for the column"),
  position: z
    .enum(["start", "end"])
    .optional()
    .default("end")
    .describe("Where to insert: start or end of board"),
});

export const createColumnsSchema = z.object({
  columns: z
    .array(createColumnItemSchema)
    .min(1)
    .max(20)
    .describe("Columns to create (1-20)"),
});

/**
 * Single column update item.
 *
 * Supports field updates and reordering via index.
 */
const updateColumnItemSchema = z.object({
  columnId: z.string().uuid().describe("Column ID to update"),
  title: z.string().min(1).max(50).optional().describe("New column title"),
  icon: z.string().optional().describe("New emoji icon"),
  index: z
    .number()
    .int()
    .min(0)
    .optional()
    .describe("New position in board (0-indexed, for reordering)"),
});

export const updateColumnsSchema = z.object({
  updates: z
    .array(updateColumnItemSchema)
    .min(1)
    .max(20)
    .describe("Column updates to apply (1-20)"),
});

/** Single column deletion item. */
const deleteColumnItemSchema = z.object({
  columnId: z.string().uuid().describe("Column ID to delete"),
  moveTasksTo: z
    .string()
    .uuid()
    .optional()
    .describe(
      "Column ID to move existing tasks to. If not provided, tasks will be deleted.",
    ),
});

export const deleteColumnsSchema = z.object({
  columns: z
    .array(deleteColumnItemSchema)
    .min(1)
    .max(20)
    .describe("Columns to delete (1-20)"),
});

// ─────────────────────────────────────────────
// Comment Tool Schema
// ─────────────────────────────────────────────

/** Single comment item. */
const createCommentItemSchema = z.object({
  taskId: taskIdSchema,
  taskNumber: taskNumberSchema,
  content: z.string().describe("Comment text"),
});

export const createCommentsSchema = z.object({
  comments: z
    .array(createCommentItemSchema)
    .min(1)
    .max(50)
    .describe("Comments to create (1-50)"),
});

// ─────────────────────────────────────────────
// Delegation Tool Schema
// ─────────────────────────────────────────────

export const delegationSchema = z.object({
  personaId: z
    .string()
    .uuid()
    .describe("ID of the agent persona to delegate to"),
  instruction: z
    .string()
    .min(1)
    .max(2000)
    .describe("The instruction for the delegate agent"),
});

// ─────────────────────────────────────────────
// Type Exports
// ─────────────────────────────────────────────

export type TaskRef = z.infer<typeof taskRefSchema>;
export type LabelAdd = z.infer<typeof labelAddSchema>;

export type QueryTasksInput = z.infer<typeof queryTasksSchema>;
export type QueryProjectInput = z.infer<typeof queryProjectSchema>;
export type GetTaskInput = z.infer<typeof getTaskSchema>;

export type CreateTasksInput = z.infer<typeof createTasksSchema>;
export type UpdateTasksInput = z.infer<typeof updateTasksSchema>;
export type UpdateTaskItem = z.infer<typeof updateTaskItemSchema>;
export type DeleteTasksInput = z.infer<typeof deleteTasksSchema>;

export type CreateColumnsInput = z.infer<typeof createColumnsSchema>;
export type UpdateColumnsInput = z.infer<typeof updateColumnsSchema>;
export type DeleteColumnsInput = z.infer<typeof deleteColumnsSchema>;

export type CreateCommentsInput = z.infer<typeof createCommentsSchema>;
