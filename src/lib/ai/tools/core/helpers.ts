/**
 * Shared helpers for AI agent tool implementations.
 *
 * Provides batch task/column resolution for unified array-based tools.
 */

import { and, eq, inArray, max, or } from "drizzle-orm";

import { dbPool } from "lib/db/db";
import { columns, tasks } from "lib/db/schema";

import type { TaskRef } from "./schemas";

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

// ─────────────────────────────────────────────
// Batch Helpers (N+1 Prevention)
// ─────────────────────────────────────────────

/**
 * Batch resolve tasks by ID or project-scoped number.
 *
 * Uses a single query with `inArray()` instead of N sequential queries.
 * Returns tasks in the same order as input refs, throwing if any task is not found.
 */
export async function resolveTasks(
  refs: TaskRef[],
  projectId: string,
): Promise<Array<typeof tasks.$inferSelect>> {
  if (refs.length === 0) return [];

  const idRefs = refs.filter((r) => r.taskId);
  const numberRefs = refs.filter(
    (r) => r.taskNumber !== undefined && !r.taskId,
  );

  const taskIds = idRefs.map((r) => r.taskId!);
  const taskNumbers = numberRefs.map((r) => r.taskNumber!);

  const conditions = [];
  if (taskIds.length > 0) {
    conditions.push(
      and(inArray(tasks.id, taskIds), eq(tasks.projectId, projectId)),
    );
  }
  if (taskNumbers.length > 0) {
    conditions.push(
      and(inArray(tasks.number, taskNumbers), eq(tasks.projectId, projectId)),
    );
  }

  if (conditions.length === 0) {
    throw new Error("No valid task references provided.");
  }

  const foundTasks = await dbPool.query.tasks.findMany({
    where: conditions.length === 1 ? conditions[0] : or(...conditions),
  });

  const byId = new Map(foundTasks.map((t) => [t.id, t]));
  const byNumber = new Map(
    foundTasks.filter((t) => t.number !== null).map((t) => [t.number!, t]),
  );

  const result: Array<typeof tasks.$inferSelect> = [];
  for (const ref of refs) {
    const task = ref.taskId
      ? byId.get(ref.taskId)
      : byNumber.get(ref.taskNumber!);
    if (!task) {
      const refStr = ref.taskId ?? `T-${ref.taskNumber}`;
      throw new Error(`Task ${refStr} not found in this project.`);
    }
    result.push(task);
  }

  return result;
}

/**
 * Batch resolve columns by IDs, ensuring they belong to the project.
 *
 * Returns a Map of columnId -> column data for O(1) lookup.
 * Throws if any column is not found.
 */
export async function resolveColumns(
  columnIds: string[],
  projectId: string,
): Promise<Map<string, { id: string; title: string }>> {
  if (columnIds.length === 0) return new Map();

  const uniqueIds = [...new Set(columnIds)];
  const rows = await dbPool
    .select({ id: columns.id, title: columns.title })
    .from(columns)
    .where(
      and(inArray(columns.id, uniqueIds), eq(columns.projectId, projectId)),
    );

  const result = new Map(rows.map((r) => [r.id, r]));

  for (const id of uniqueIds) {
    if (!result.has(id)) {
      throw new Error(`Column ${id} not found in this project.`);
    }
  }

  return result;
}
