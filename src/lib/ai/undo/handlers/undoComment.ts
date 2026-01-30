/**
 * Undo handler for comment operations.
 *
 * Deletes the created comment.
 */

import { eq } from "drizzle-orm";

import { dbPool } from "lib/db/db";
import { posts } from "lib/db/schema";

import type { CommentSnapshot, UndoContext, UndoResult } from "../types";

export async function undoComment(
  snapshot: CommentSnapshot,
  _ctx: UndoContext,
): Promise<UndoResult> {
  if (snapshot.operation !== "addComment") {
    return {
      success: false,
      message: `Unknown operation: ${snapshot.operation}`,
    };
  }

  // Check if comment still exists
  const comment = await dbPool.query.posts.findFirst({
    where: eq(posts.id, snapshot.entityId),
    columns: { id: true },
  });

  if (!comment) {
    return {
      success: false,
      message: "Comment has already been deleted",
    };
  }

  await dbPool.delete(posts).where(eq(posts.id, snapshot.entityId));

  return {
    success: true,
    message: "Comment deleted",
    restoredEntityId: snapshot.entityId,
  };
}
