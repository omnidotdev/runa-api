/**
 * Shared helpers for AI agent tool implementations.
 *
 * Extracted from write.tools.ts for reuse across write and destructive tools.
 */

import { and, eq, max, or } from "drizzle-orm";

import { dbPool } from "lib/db/db";
import { labels, tasks } from "lib/db/schema";

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
