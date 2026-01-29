/**
 * batchMoveTasks tool definition.
 *
 * Move multiple tasks to a target column in one operation.
 */

import { and, eq } from "drizzle-orm";

import { dbPool } from "lib/db/db";
import { columns, tasks } from "lib/db/schema";
import {
  getColumnTitles,
  getNextColumnIndex,
  resolveTasks,
} from "../../core/helpers";

import type { WriteToolContext } from "../../core/context";
import type { BatchMoveTasksInput } from "../../core/schemas";

export const BATCH_MOVE_TASKS_DESCRIPTION =
  "Move multiple tasks to a target column in one operation.";

export interface BatchMoveTasksResult {
  movedCount: number;
  targetColumn: string;
  movedTasks: Array<{
    id: string;
    number: number | null;
    title: string;
    fromColumn: string;
  }>;
  errors: string[];
  affectedIds: string[];
  snapshotBefore: Array<{
    taskId: string;
    columnId: string;
    columnIndex: number;
  }>;
}

export async function executeBatchMoveTasks(
  input: BatchMoveTasksInput,
  ctx: WriteToolContext,
): Promise<BatchMoveTasksResult> {
  const resolvedTasks = await resolveTasks(input.tasks, ctx.projectId);
  const sourceColumnIds = resolvedTasks.map((t) => t.columnId);
  const columnTitleMap = await getColumnTitles(sourceColumnIds);

  const snapshotBefore = resolvedTasks.map((t) => ({
    taskId: t.id,
    columnId: t.columnId,
    columnIndex: t.columnIndex,
  }));

  const result = await dbPool.transaction(async (tx) => {
    const targetColumn = await tx.query.columns.findFirst({
      where: and(
        eq(columns.id, input.columnId),
        eq(columns.projectId, ctx.projectId),
      ),
      columns: { id: true, title: true },
    });

    if (!targetColumn) {
      throw new Error(`Column ${input.columnId} not found in this project.`);
    }

    const movedTasks: Array<{
      id: string;
      number: number | null;
      title: string;
      fromColumn: string;
    }> = [];
    const affectedIds: string[] = [];
    let nextIndex = await getNextColumnIndex(input.columnId);

    for (const task of resolvedTasks) {
      await tx
        .update(tasks)
        .set({ columnId: input.columnId, columnIndex: nextIndex })
        .where(eq(tasks.id, task.id));
      nextIndex++;
      movedTasks.push({
        id: task.id,
        number: task.number,
        title: task.content,
        fromColumn: columnTitleMap.get(task.columnId) ?? "Unknown",
      });
      affectedIds.push(task.id);
    }

    return {
      movedCount: movedTasks.length,
      targetColumn: targetColumn.title,
      movedTasks,
      errors: [] as string[],
      affectedIds,
    };
  });

  return {
    ...result,
    snapshotBefore,
  };
}
