/**
 * deleteTask tool definition.
 *
 * Permanently delete a task. This cannot be undone.
 */

import { eq } from "drizzle-orm";

import { dbPool } from "lib/db/db";
import { tasks } from "lib/db/schema";
import { resolveTask } from "../../core/helpers";

import type { WriteToolContext } from "../../core/context";
import type { DeleteTaskInput } from "../../core/schemas";

export const DELETE_TASK_DESCRIPTION =
  "Permanently delete a task. This cannot be undone.";

export interface DeleteTaskResult {
  deletedTaskId: string;
  deletedTaskNumber: number | null;
  deletedTaskTitle: string;
  snapshotBefore: {
    content: string;
    description: string | null;
    priority: string;
    columnId: string;
    columnIndex: number;
    dueDate: string | null;
    authorId: string | null;
  };
}

export async function executeDeleteTask(
  input: DeleteTaskInput,
  ctx: WriteToolContext,
): Promise<DeleteTaskResult> {
  const task = await resolveTask(input, ctx.projectId);

  const snapshotBefore = {
    content: task.content,
    description: task.description,
    priority: task.priority,
    columnId: task.columnId,
    columnIndex: task.columnIndex,
    dueDate: task.dueDate,
    authorId: task.authorId,
  };

  await dbPool.delete(tasks).where(eq(tasks.id, task.id));

  return {
    deletedTaskId: task.id,
    deletedTaskNumber: task.number,
    deletedTaskTitle: task.content,
    snapshotBefore,
  };
}
