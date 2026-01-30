/**
 * createTasks tool definition.
 *
 * Create one or more tasks in the current project.
 * Uses sequential execution for columnIndex ordering.
 */

import { count, eq } from "drizzle-orm";

import { dbPool } from "lib/db/db";
import { tasks } from "lib/db/schema";
import { isWithinLimit } from "lib/entitlements/helpers";
import { getNextColumnIndex, resolveColumns } from "../../core/helpers";

import type { WriteToolContext } from "../../core/context";
import type { CreateTasksInput } from "../../core/schemas";

export const CREATE_TASKS_DESCRIPTION =
  "Create one or more tasks in the current project.";

interface CreateTasksResultItem {
  id: string;
  number: number | null;
  title: string;
  columnId: string;
  columnTitle: string;
  priority: string;
}

interface CreateTasksResult {
  createdCount: number;
  tasks: CreateTasksResultItem[];
  affectedIds: string[];
}

/**
 * Convert markdown to HTML for task descriptions.
 * Import from markdown module to avoid circular dependencies.
 */
export type MarkdownToHtmlFn = (input: string) => string;

export async function executeCreateTasks(
  input: CreateTasksInput,
  ctx: WriteToolContext,
  markdownToHtml?: MarkdownToHtmlFn,
): Promise<CreateTasksResult> {
  // Pre-validation: check task limit and resolve all columns in parallel
  const columnIds = [...new Set(input.tasks.map((t) => t.columnId))];

  const [taskCountResult, columnMap] = await Promise.all([
    dbPool
      .select({ count: count() })
      .from(tasks)
      .where(eq(tasks.projectId, ctx.projectId)),
    resolveColumns(columnIds, ctx.projectId),
  ]);

  const currentTaskCount = taskCountResult[0]?.count ?? 0;

  // Check if adding all tasks would exceed the limit
  const withinLimit = await isWithinLimit(
    { organizationId: ctx.organizationId },
    "max_tasks",
    currentTaskCount + input.tasks.length - 1,
  );

  if (!withinLimit) {
    throw new Error("Task limit reached for your plan.");
  }

  // Track column indices per column for sequential assignment
  const columnIndexMap = new Map<string, number>();

  // Pre-fetch starting indices for all columns in parallel
  await Promise.all(
    columnIds.map(async (columnId) => {
      const nextIndex = await getNextColumnIndex(columnId);
      columnIndexMap.set(columnId, nextIndex);
    }),
  );

  // Transaction with sequential inserts (columnIndex ordering)
  const results = await dbPool.transaction(async (tx) => {
    const createdTasks: CreateTasksResultItem[] = [];

    for (const taskData of input.tasks) {
      const column = columnMap.get(taskData.columnId)!;
      const columnIndex = columnIndexMap.get(taskData.columnId)!;

      // Increment for next task in same column
      columnIndexMap.set(taskData.columnId, columnIndex + 1);

      const descriptionHtml =
        taskData.description && markdownToHtml
          ? markdownToHtml(taskData.description)
          : (taskData.description ?? "");

      const [created] = await tx
        .insert(tasks)
        .values({
          content: taskData.title,
          description: descriptionHtml,
          priority: taskData.priority ?? "medium",
          columnId: taskData.columnId,
          columnIndex,
          projectId: ctx.projectId,
          authorId: ctx.userId,
          dueDate: taskData.dueDate ?? null,
        })
        .returning({
          id: tasks.id,
          number: tasks.number,
          title: tasks.content,
          columnId: tasks.columnId,
          priority: tasks.priority,
        });

      createdTasks.push({
        id: created.id,
        number: created.number,
        title: created.title,
        columnId: created.columnId,
        columnTitle: column.title,
        priority: created.priority,
      });
    }

    return createdTasks;
  });

  return {
    createdCount: results.length,
    tasks: results,
    affectedIds: results.map((t) => t.id),
  };
}
