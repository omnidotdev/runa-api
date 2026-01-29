/**
 * addComment tool definition.
 *
 * Add a comment to a task.
 */

import { dbPool } from "lib/db/db";
import { posts } from "lib/db/schema";
import { resolveTask } from "../../core/helpers";

import type { WriteToolContext } from "../../core/context";
import type { AddCommentInput } from "../../core/schemas";

export const ADD_COMMENT_DESCRIPTION = "Add a comment to a task.";

export interface AddCommentResult {
  commentId: string;
  taskId: string;
  taskNumber: number | null;
  taskTitle: string;
}

export async function executeAddComment(
  input: AddCommentInput,
  ctx: WriteToolContext,
): Promise<AddCommentResult> {
  const task = await resolveTask(input, ctx.projectId);

  const [comment] = await dbPool
    .insert(posts)
    .values({
      description: input.content,
      authorId: ctx.userId,
      taskId: task.id,
    })
    .returning({ id: posts.id });

  return {
    commentId: comment.id,
    taskId: task.id,
    taskNumber: task.number,
    taskTitle: task.content,
  };
}
