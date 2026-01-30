/**
 * Shared Zod schemas for AI agent tool inputs.
 *
 * Single source of truth for all tool input validation.
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
// Write Tool Schemas
// ─────────────────────────────────────────────

export const createTaskSchema = z.object({
  title: z.string().describe("Task title"),
  columnId: z.string().uuid().describe("Column ID to place the task in"),
  description: z.string().optional().describe("Task description"),
  priority: prioritySchema.optional().describe("Priority level"),
  dueDate: z
    .string()
    .datetime()
    .optional()
    .describe("Due date in ISO 8601 format"),
});

export const updateTaskSchema = z.object({
  taskId: taskIdSchema,
  taskNumber: taskNumberSchema,
  title: z.string().optional().describe("New task title"),
  description: z.string().optional().describe("New task description"),
  priority: prioritySchema.optional().describe("New priority level"),
  dueDate: dueDateSchema.describe("New due date or null to clear"),
});

export const moveTaskSchema = z.object({
  taskId: taskIdSchema,
  taskNumber: taskNumberSchema,
  columnId: z.string().uuid().describe("Target column ID"),
});

export const assignTaskSchema = z.object({
  taskId: taskIdSchema,
  taskNumber: taskNumberSchema,
  userId: z.string().uuid().describe("User ID to assign or unassign"),
  action: z
    .enum(["add", "remove"])
    .describe("Whether to add or remove the assignee"),
});

export const addLabelSchema = z.object({
  taskId: taskIdSchema,
  taskNumber: taskNumberSchema,
  labelId: z.string().uuid().optional().describe("Label ID"),
  labelName: z.string().optional().describe("Label name"),
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

export const removeLabelSchema = z.object({
  taskId: taskIdSchema,
  taskNumber: taskNumberSchema,
  labelId: z.string().uuid().describe("Label ID to remove"),
});

export const addCommentSchema = z.object({
  taskId: taskIdSchema,
  taskNumber: taskNumberSchema,
  content: z.string().describe("Comment text"),
});

// ─────────────────────────────────────────────
// Destructive Tool Schemas
// ─────────────────────────────────────────────

export const deleteTaskSchema = z.object({
  taskId: taskIdSchema,
  taskNumber: taskNumberSchema,
});

const taskRefSchema = z.object({
  taskId: z.string().uuid().optional(),
  taskNumber: z.number().optional(),
});

export const batchMoveTasksSchema = z.object({
  tasks: z.array(taskRefSchema).min(1).max(50).describe("Tasks to move (1-50)"),
  columnId: z.string().uuid().describe("Target column ID"),
});

export const batchUpdateTasksSchema = z.object({
  tasks: z
    .array(taskRefSchema)
    .min(1)
    .max(50)
    .describe("Tasks to update (1-50)"),
  priority: prioritySchema.optional().describe("New priority for all tasks"),
  dueDate: dueDateSchema.describe("New due date for all tasks"),
});

export const batchDeleteTasksSchema = z.object({
  tasks: z
    .array(taskRefSchema)
    .min(1)
    .max(50)
    .describe("Tasks to delete (1-50)"),
});

// ─────────────────────────────────────────────
// Column Tool Schemas
// ─────────────────────────────────────────────

export const createColumnSchema = z.object({
  title: z.string().min(1).max(50).describe("Column title"),
  icon: z.string().optional().describe("Emoji icon for the column"),
  position: z
    .enum(["start", "end"])
    .optional()
    .default("end")
    .describe("Where to insert: start or end of board"),
});

export const updateColumnSchema = z.object({
  columnId: z.string().uuid().describe("Column ID to update"),
  title: z.string().min(1).max(50).optional().describe("New column title"),
  icon: z.string().optional().describe("New emoji icon"),
});

export const deleteColumnSchema = z.object({
  columnId: z.string().uuid().describe("Column ID to delete"),
  moveTasksTo: z
    .string()
    .uuid()
    .optional()
    .describe(
      "Column ID to move existing tasks to. If not provided, tasks will be deleted.",
    ),
});

export const reorderColumnsSchema = z.object({
  columnIds: z
    .array(z.string().uuid())
    .min(1)
    .describe(
      "Column IDs in desired order. All project columns must be included.",
    ),
});

export const reorderTasksSchema = z.object({
  columnId: z
    .string()
    .uuid()
    .describe("Column ID containing the tasks to reorder"),
  taskIds: z
    .array(z.string().uuid())
    .min(1)
    .max(100)
    .describe(
      "Task IDs in desired order. All tasks in the column must be included.",
    ),
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

export type QueryTasksInput = z.infer<typeof queryTasksSchema>;
export type QueryProjectInput = z.infer<typeof queryProjectSchema>;
export type GetTaskInput = z.infer<typeof getTaskSchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type MoveTaskInput = z.infer<typeof moveTaskSchema>;
export type AssignTaskInput = z.infer<typeof assignTaskSchema>;
export type AddLabelInput = z.infer<typeof addLabelSchema>;
export type RemoveLabelInput = z.infer<typeof removeLabelSchema>;
export type AddCommentInput = z.infer<typeof addCommentSchema>;
export type DeleteTaskInput = z.infer<typeof deleteTaskSchema>;
export type BatchMoveTasksInput = z.infer<typeof batchMoveTasksSchema>;
export type BatchUpdateTasksInput = z.infer<typeof batchUpdateTasksSchema>;
export type BatchDeleteTasksInput = z.infer<typeof batchDeleteTasksSchema>;
export type CreateColumnInput = z.infer<typeof createColumnSchema>;
export type UpdateColumnInput = z.infer<typeof updateColumnSchema>;
export type DeleteColumnInput = z.infer<typeof deleteColumnSchema>;
export type ReorderColumnsInput = z.infer<typeof reorderColumnsSchema>;
export type ReorderTasksInput = z.infer<typeof reorderTasksSchema>;
