/**
 * moveTask tool definition.
 *
 * Move a task to a different column (status).
 */

import { and, eq } from "drizzle-orm";

import { dbPool } from "lib/db/db";
import { columns, tasks } from "lib/db/schema";
import { getNextColumnIndex, resolveTask } from "../../core/helpers";

import type { WriteToolContext } from "../../core/context";
import type { MoveTaskInput } from "../../core/schemas";

export const MOVE_TASK_DESCRIPTION =
  "Move a task to a different column (status).";

export interface MoveTaskResult {
  task: {
    id: string;
    number: number | null;
    title: string;
  };
  fromColumn: string;
  toColumn: string;
  previousState: {
    columnId: string;
    columnIndex: number;
  };
}

export async function executeMoveTask(
  input: MoveTaskInput,
  ctx: WriteToolContext,
): Promise<MoveTaskResult> {
  const task = await resolveTask(input, ctx.projectId);

  const targetColumn = await dbPool.query.columns.findFirst({
    where: and(
      eq(columns.id, input.columnId),
      eq(columns.projectId, ctx.projectId),
    ),
    columns: { id: true, title: true },
  });

  if (!targetColumn) {
    throw new Error(`Column ${input.columnId} not found in this project.`);
  }

  const sourceColumn = await dbPool.query.columns.findFirst({
    where: eq(columns.id, task.columnId),
    columns: { title: true },
  });

  const previousState = {
    columnId: task.columnId,
    columnIndex: task.columnIndex,
  };

  const nextIndex = await getNextColumnIndex(input.columnId);

  await dbPool
    .update(tasks)
    .set({ columnId: input.columnId, columnIndex: nextIndex })
    .where(eq(tasks.id, task.id));

  return {
    task: { id: task.id, number: task.number, title: task.content },
    fromColumn: sourceColumn?.title ?? "Unknown",
    toColumn: targetColumn.title,
    previousState,
  };
}
