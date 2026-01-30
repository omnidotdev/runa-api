/**
 * reorderTasks tool definition.
 *
 * Reorder tasks within a column. Useful for triage/prioritization workflows
 * where an agent needs to sort tasks by importance or urgency.
 */

import { eq } from "drizzle-orm";

import { dbPool } from "lib/db/db";
import { tasks } from "lib/db/schema";

import type { WriteToolContext } from "../../core/context";
import type { ReorderTasksInput } from "../../core/schemas";

export const REORDER_TASKS_DESCRIPTION =
  "Reorder tasks within a column. Use this to prioritize or sort tasks by importance.";

export interface ReorderTasksResult {
  tasks: Array<{
    id: string;
    number: number | null;
    title: string;
    columnIndex: number;
  }>;
  previousOrder: Array<{
    id: string;
    columnIndex: number;
  }>;
  columnId: string;
}

export async function executeReorderTasks(
  input: ReorderTasksInput,
  ctx: WriteToolContext,
): Promise<ReorderTasksResult> {
  // Get all tasks in the specified column
  const columnTasks = await dbPool.query.tasks.findMany({
    where: eq(tasks.columnId, input.columnId),
    columns: {
      id: true,
      number: true,
      content: true,
      columnIndex: true,
      projectId: true,
    },
    orderBy: tasks.columnIndex,
  });

  // Validate column belongs to this project
  if (columnTasks.length > 0 && columnTasks[0].projectId !== ctx.projectId) {
    throw new Error("Column does not belong to this project.");
  }

  const columnTaskIds = new Set(columnTasks.map((t) => t.id));
  const inputTaskIds = new Set(input.taskIds);

  // Validate all input tasks belong to this column
  for (const taskId of input.taskIds) {
    if (!columnTaskIds.has(taskId)) {
      throw new Error(
        `Task ${taskId} not found in column ${input.columnId}. Only tasks in the specified column can be reordered.`,
      );
    }
  }

  // Validate all column tasks are included
  for (const task of columnTasks) {
    if (!inputTaskIds.has(task.id)) {
      throw new Error(
        `Missing task ${task.id} (T-${task.number}). All tasks in the column must be included in the reorder.`,
      );
    }
  }

  // Capture previous order for undo
  const previousOrder = columnTasks.map((t) => ({
    id: t.id,
    columnIndex: t.columnIndex,
  }));

  // Update each task's columnIndex
  const updatedTasks: ReorderTasksResult["tasks"] = [];

  for (let i = 0; i < input.taskIds.length; i++) {
    const taskId = input.taskIds[i];
    const task = columnTasks.find((t) => t.id === taskId);

    if (task && task.columnIndex !== i) {
      await dbPool
        .update(tasks)
        .set({ columnIndex: i })
        .where(eq(tasks.id, taskId));
    }

    if (task) {
      updatedTasks.push({
        id: task.id,
        number: task.number,
        title: task.content,
        columnIndex: i,
      });
    }
  }

  return {
    tasks: updatedTasks,
    previousOrder,
    columnId: input.columnId,
  };
}
