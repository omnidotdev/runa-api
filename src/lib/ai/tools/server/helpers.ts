/**
 * Shared helpers for AI agent tool implementations.
 *
 * Extracted from write.tools.ts for reuse across write and destructive tools.
 */

import { and, eq, inArray, max, or } from "drizzle-orm";

import { dbPool } from "lib/db/db";
import { columns, labels, tasks } from "lib/db/schema";

/** Task reference input type. */
export interface TaskRef {
  taskId?: string;
  taskNumber?: number;
}

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
    : and(eq(tasks.number, input.taskNumber!), eq(tasks.projectId, projectId));

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
 * Resolve a label by ID, ensuring it belongs to the given project or organization.
 * Throws if the label is not found.
 */
export async function resolveLabel(
  labelId: string,
  projectId: string,
  organizationId: string,
): Promise<{ id: string; name: string }> {
  const label = await dbPool.query.labels.findFirst({
    where: and(
      eq(labels.id, labelId),
      or(
        eq(labels.projectId, projectId),
        eq(labels.organizationId, organizationId),
      ),
    ),
    columns: { id: true, name: true },
  });

  if (!label) {
    throw new Error(
      `Label ${labelId} not found in this project or organization.`,
    );
  }

  return label;
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

  // Separate refs by type for efficient batching
  const idRefs = refs.filter((r) => r.taskId);
  const numberRefs = refs.filter(
    (r) => r.taskNumber !== undefined && !r.taskId,
  );

  const taskIds = idRefs.map((r) => r.taskId!);
  const taskNumbers = numberRefs.map((r) => r.taskNumber!);

  // Build a single query with OR conditions for both ID and number lookups
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

  // Build lookup maps for O(1) access
  const byId = new Map(foundTasks.map((t) => [t.id, t]));
  const byNumber = new Map(
    foundTasks.filter((t) => t.number !== null).map((t) => [t.number!, t]),
  );

  // Return in original order, throwing if any ref is missing
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
 * Batch fetch column titles by IDs.
 *
 * Returns a Map of columnId -> title for O(1) lookup.
 */
export async function getColumnTitles(
  columnIds: string[],
): Promise<Map<string, string>> {
  if (columnIds.length === 0) return new Map();

  const uniqueIds = [...new Set(columnIds)];
  const rows = await dbPool
    .select({ id: columns.id, title: columns.title })
    .from(columns)
    .where(inArray(columns.id, uniqueIds));

  return new Map(rows.map((r) => [r.id, r.title]));
}
