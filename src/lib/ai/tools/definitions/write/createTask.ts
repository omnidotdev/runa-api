/**
 * createTask tool definition.
 *
 * Create a new task in the current project.
 */

import { and, count, eq } from "drizzle-orm";

import { dbPool } from "lib/db/db";
import { columns, tasks } from "lib/db/schema";
import { isWithinLimit } from "lib/entitlements/helpers";
import { getNextColumnIndex } from "../../core/helpers";

import type { WriteToolContext } from "../../core/context";
import type { CreateTaskInput } from "../../core/schemas";

export const CREATE_TASK_DESCRIPTION =
  "Create a new task in the current project.";

export interface CreateTaskResult {
  task: {
    id: string;
    number: number | null;
    title: string;
    columnId: string;
    columnTitle: string;
    priority: string;
  };
}

/**
 * Convert markdown to HTML for task descriptions.
 * Import from markdown module to avoid circular dependencies.
 */
export type MarkdownToHtmlFn = (input: string) => string;

export async function executeCreateTask(
  input: CreateTaskInput,
  ctx: WriteToolContext,
  markdownToHtml?: MarkdownToHtmlFn,
): Promise<CreateTaskResult> {
  const taskCount = await dbPool
    .select({ count: count() })
    .from(tasks)
    .where(eq(tasks.projectId, ctx.projectId))
    .then((rows) => rows[0]?.count ?? 0);

  const withinLimit = await isWithinLimit(
    { organizationId: ctx.organizationId },
    "max_tasks",
    taskCount,
  );

  if (!withinLimit) {
    throw new Error("Task limit reached for your plan.");
  }

  const column = await dbPool.query.columns.findFirst({
    where: and(
      eq(columns.id, input.columnId),
      eq(columns.projectId, ctx.projectId),
    ),
    columns: { id: true, title: true },
  });

  if (!column) {
    throw new Error(`Column ${input.columnId} not found in this project.`);
  }

  const nextIndex = await getNextColumnIndex(input.columnId);
  const descriptionHtml =
    input.description && markdownToHtml
      ? markdownToHtml(input.description)
      : (input.description ?? "");

  const [created] = await dbPool
    .insert(tasks)
    .values({
      content: input.title,
      description: descriptionHtml,
      priority: input.priority ?? "medium",
      columnId: input.columnId,
      columnIndex: nextIndex,
      projectId: ctx.projectId,
      authorId: ctx.userId,
      dueDate: input.dueDate ?? null,
    })
    .returning({
      id: tasks.id,
      number: tasks.number,
      title: tasks.content,
      columnId: tasks.columnId,
      priority: tasks.priority,
    });

  return {
    task: {
      id: created.id,
      number: created.number,
      title: created.title,
      columnId: created.columnId,
      columnTitle: column.title,
      priority: created.priority,
    },
  };
}
