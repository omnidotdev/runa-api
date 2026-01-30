/**
 * createComments tool definition.
 *
 * Create comments on one or more tasks.
 * Uses parallel execution since comment operations are independent.
 */

import { dbPool } from "lib/db/db";
import { posts } from "lib/db/schema";
import { resolveTasks } from "../../core/helpers";

import type { WriteToolContext } from "../../core/context";
import type { CreateCommentsInput } from "../../core/schemas";

export const CREATE_COMMENTS_DESCRIPTION = "Add comments to one or more tasks.";

interface CreateCommentsResultItem {
  commentId: string;
  taskId: string;
  taskNumber: number | null;
  taskTitle: string;
}

interface CreateCommentsResult {
  count: number;
  comments: CreateCommentsResultItem[];
  affectedIds: string[];
}

export async function executeCreateComments(
  input: CreateCommentsInput,
  ctx: WriteToolContext,
): Promise<CreateCommentsResult> {
  // Build task refs for batch resolution
  const refs = input.comments.map((c) => ({
    taskId: c.taskId,
    taskNumber: c.taskNumber,
  }));

  // Batch resolve all tasks
  const resolvedTasks = await resolveTasks(refs, ctx.projectId);

  // Parallel execution within transaction
  const results = await dbPool.transaction(async (tx) => {
    const commentPromises = input.comments.map(async (commentData, index) => {
      const task = resolvedTasks[index];

      const [comment] = await tx
        .insert(posts)
        .values({
          description: commentData.content,
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
    });

    return Promise.all(commentPromises);
  });

  return {
    count: results.length,
    comments: results,
    affectedIds: [...new Set(results.map((r) => r.taskId))],
  };
}
