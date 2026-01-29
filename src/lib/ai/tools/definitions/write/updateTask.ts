/**
 * updateTask tool definition.
 *
 * Update a task's title, description, priority, or due date.
 */

import { eq } from "drizzle-orm";

import { dbPool } from "lib/db/db";
import { tasks } from "lib/db/schema";
import { resolveTask } from "../../core/helpers";

import type { WriteToolContext } from "../../core/context";
import type { UpdateTaskInput } from "../../core/schemas";
import type { MarkdownToHtmlFn } from "./createTask";

export const UPDATE_TASK_DESCRIPTION =
  "Update a task's title, description, priority, or due date.";

export interface UpdateTaskResult {
  task: {
    id: string;
    number: number | null;
    title: string;
    priority: string;
    dueDate: string | null;
  };
  previousState: {
    content: string;
    description: string | null;
    priority: string;
    dueDate: string | null;
  };
}

export async function executeUpdateTask(
  input: UpdateTaskInput,
  ctx: WriteToolContext,
  markdownToHtml?: MarkdownToHtmlFn,
): Promise<UpdateTaskResult> {
  const task = await resolveTask(input, ctx.projectId);

  const patch: Record<string, unknown> = {};
  if (input.title !== undefined) patch.content = input.title;
  if (input.description !== undefined) {
    patch.description = markdownToHtml
      ? markdownToHtml(input.description)
      : input.description;
  }
  if (input.priority !== undefined) patch.priority = input.priority;
  if (input.dueDate !== undefined) patch.dueDate = input.dueDate;

  if (Object.keys(patch).length === 0) {
    throw new Error("No fields to update.");
  }

  const previousState = {
    content: task.content,
    description: task.description,
    priority: task.priority,
    dueDate: task.dueDate,
  };

  const [updated] = await dbPool
    .update(tasks)
    .set(patch)
    .where(eq(tasks.id, task.id))
    .returning({
      id: tasks.id,
      number: tasks.number,
      title: tasks.content,
      priority: tasks.priority,
      dueDate: tasks.dueDate,
    });

  return {
    task: {
      id: updated.id,
      number: updated.number,
      title: updated.title,
      priority: updated.priority,
      dueDate: updated.dueDate,
    },
    previousState,
  };
}
