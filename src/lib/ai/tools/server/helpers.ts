/**
 * Shared helpers for AI agent tool implementations.
 *
 * Extracted from write.tools.ts for reuse across write and destructive tools.
 */

import { and, eq, max } from "drizzle-orm";

import { dbPool } from "lib/db/db";
import { tasks } from "lib/db/schema";

/**
 * Resolve a task by ID or project-scoped number.
 * Throws if neither is provided or the task is not found.
 */
export async function resolveTask(
  input: { taskId?: string; taskNumber?: number },
  projectId: string,
) {
  if (!input.taskId && input.taskNumber === undefined) {
    throw new Error("Either taskId or taskNumber must be provided.");
  }

  const condition = input.taskId
    ? and(eq(tasks.id, input.taskId), eq(tasks.projectId, projectId))
    : and(
        eq(tasks.number, input.taskNumber!),
        eq(tasks.projectId, projectId),
      );

  const task = await dbPool.query.tasks.findFirst({
    where: condition,
  });

  if (!task) {
    const ref = input.taskId ?? `T-${input.taskNumber}`;
    throw new Error(`Task ${ref} not found in this project.`);
  }

  return task;
}

/**
 * Get the next column index for appending a task at the end of a column.
 */
export async function getNextColumnIndex(columnId: string): Promise<number> {
  const result = await dbPool
    .select({ maxIndex: max(tasks.columnIndex) })
    .from(tasks)
    .where(eq(tasks.columnId, columnId));

  const current = result[0]?.maxIndex;
  return current !== null && current !== undefined ? current + 1 : 0;
}
