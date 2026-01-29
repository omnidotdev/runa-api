/**
 * batchUpdateTasks tool definition.
 *
 * Update fields on multiple tasks at once.
 */

import { eq } from "drizzle-orm";

import { dbPool } from "lib/db/db";
import { tasks } from "lib/db/schema";
import { resolveTasks } from "../../core/helpers";

import type { WriteToolContext } from "../../core/context";
import type { BatchUpdateTasksInput } from "../../core/schemas";

export const BATCH_UPDATE_TASKS_DESCRIPTION =
  "Update fields on multiple tasks at once.";

export interface BatchUpdateTasksResult {
  updatedCount: number;
  updatedTasks: Array<{
    id: string;
    number: number | null;
    title: string;
  }>;
  errors: string[];
  affectedIds: string[];
  snapshotBefore: Array<{
    taskId: string;
    priority: string;
    dueDate: string | null;
  }>;
}

export async function executeBatchUpdateTasks(
  input: BatchUpdateTasksInput,
  ctx: WriteToolContext,
): Promise<BatchUpdateTasksResult> {
  const patch: Record<string, unknown> = {};
  if (input.priority !== undefined) patch.priority = input.priority;
  if (input.dueDate !== undefined) patch.dueDate = input.dueDate;

  if (Object.keys(patch).length === 0) {
    throw new Error("No fields to update.");
  }

  const resolvedTasks = await resolveTasks(input.tasks, ctx.projectId);

  const snapshotBefore = resolvedTasks.map((t) => ({
    taskId: t.id,
    priority: t.priority,
    dueDate: t.dueDate,
  }));

  const result = await dbPool.transaction(async (tx) => {
    const updatedTasks: Array<{
      id: string;
      number: number | null;
      title: string;
    }> = [];
    const affectedIds: string[] = [];

    for (const task of resolvedTasks) {
      await tx.update(tasks).set(patch).where(eq(tasks.id, task.id));
      updatedTasks.push({
        id: task.id,
        number: task.number,
        title: task.content,
      });
      affectedIds.push(task.id);
    }

    return {
      updatedCount: updatedTasks.length,
      updatedTasks,
      errors: [] as string[],
      affectedIds,
    };
  });

  return {
    ...result,
    snapshotBefore,
  };
}
