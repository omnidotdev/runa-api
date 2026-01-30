/**
 * deleteTasks tool definition.
 *
 * Permanently delete one or more tasks. This cannot be undone.
 * Uses parallel execution since deletes are independent.
 */

import { eq } from "drizzle-orm";

import { dbPool } from "lib/db/db";
import { tasks } from "lib/db/schema";
import { resolveTasks } from "../../core/helpers";

import type { WriteToolContext } from "../../core/context";
import type { DeleteTasksInput } from "../../core/schemas";

export const DELETE_TASKS_DESCRIPTION =
  "Permanently delete one or more tasks. This cannot be undone.";

interface DeleteTasksResultItem {
  id: string;
  number: number | null;
  title: string;
}

interface DeleteTasksSnapshotItem {
  taskId: string;
  content: string;
  description: string | null;
  priority: string;
  columnId: string;
  columnIndex: number;
  dueDate: string | null;
  authorId: string | null;
}

interface DeleteTasksResult {
  deletedCount: number;
  deletedTasks: DeleteTasksResultItem[];
  affectedIds: string[];
  snapshotBefore: DeleteTasksSnapshotItem[];
}

export async function executeDeleteTasks(
  input: DeleteTasksInput,
  ctx: WriteToolContext,
): Promise<DeleteTasksResult> {
  // Batch resolve all tasks
  const resolvedTasks = await resolveTasks(input.tasks, ctx.projectId);

  // Snapshot before deletes
  const snapshotBefore: DeleteTasksSnapshotItem[] = resolvedTasks.map((t) => ({
    taskId: t.id,
    content: t.content,
    description: t.description,
    priority: t.priority,
    columnId: t.columnId,
    columnIndex: t.columnIndex,
    dueDate: t.dueDate,
    authorId: t.authorId,
  }));

  // Parallel execution within transaction
  const result = await dbPool.transaction(async (tx) => {
    const deletePromises = resolvedTasks.map(async (task) => {
      await tx.delete(tasks).where(eq(tasks.id, task.id));
      return {
        id: task.id,
        number: task.number,
        title: task.content,
      };
    });

    return Promise.all(deletePromises);
  });

  return {
    deletedCount: result.length,
    deletedTasks: result,
    affectedIds: result.map((t) => t.id),
    snapshotBefore,
  };
}
