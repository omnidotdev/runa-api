/**
 * batchDeleteTasks tool definition.
 *
 * Permanently delete multiple tasks. This cannot be undone.
 */

import { eq } from "drizzle-orm";

import { dbPool } from "lib/db/db";
import { tasks } from "lib/db/schema";
import { resolveTasks } from "../../core/helpers";

import type { WriteToolContext } from "../../core/context";
import type { BatchDeleteTasksInput } from "../../core/schemas";

export const BATCH_DELETE_TASKS_DESCRIPTION =
  "Permanently delete multiple tasks. This cannot be undone.";

export interface BatchDeleteTasksResult {
  deletedCount: number;
  deletedTasks: Array<{
    id: string;
    number: number | null;
    title: string;
  }>;
  errors: string[];
  affectedIds: string[];
  snapshotBefore: Array<{
    taskId: string;
    content: string;
    description: string | null;
    priority: string;
    columnId: string;
    columnIndex: number;
    dueDate: string | null;
    authorId: string | null;
  }>;
}

export async function executeBatchDeleteTasks(
  input: BatchDeleteTasksInput,
  ctx: WriteToolContext,
): Promise<BatchDeleteTasksResult> {
  const resolvedTasks = await resolveTasks(input.tasks, ctx.projectId);

  const snapshotBefore = resolvedTasks.map((t) => ({
    taskId: t.id,
    content: t.content,
    description: t.description,
    priority: t.priority,
    columnId: t.columnId,
    columnIndex: t.columnIndex,
    dueDate: t.dueDate,
    authorId: t.authorId,
  }));

  const result = await dbPool.transaction(async (tx) => {
    const deletedTasks: Array<{
      id: string;
      number: number | null;
      title: string;
    }> = [];
    const affectedIds: string[] = [];

    for (const task of resolvedTasks) {
      await tx.delete(tasks).where(eq(tasks.id, task.id));
      deletedTasks.push({
        id: task.id,
        number: task.number,
        title: task.content,
      });
      affectedIds.push(task.id);
    }

    return {
      deletedCount: deletedTasks.length,
      deletedTasks,
      errors: [] as string[],
      affectedIds,
    };
  });

  return {
    ...result,
    snapshotBefore,
  };
}
