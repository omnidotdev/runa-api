/**
 * Undo handler for delete operations.
 *
 * Recreates the deleted task from the snapshot.
 */

import { dbPool } from "lib/db/db";
import { tasks } from "lib/db/schema";

import type { DeleteSnapshot, UndoContext, UndoResult } from "../types";

export async function undoDelete(
  snapshot: DeleteSnapshot,
  ctx: UndoContext,
): Promise<UndoResult> {
  if (snapshot.entityType !== "task") {
    return {
      success: false,
      message: `Undo not supported for entity type: ${snapshot.entityType}`,
    };
  }

  const { previousState } = snapshot;

  // Recreate the task with a new ID (original ID may have been reused or is invalid)
  const [created] = await dbPool
    .insert(tasks)
    .values({
      content: previousState.content,
      description: previousState.description ?? "",
      priority: previousState.priority,
      columnId: previousState.columnId,
      columnIndex: previousState.columnIndex,
      dueDate: previousState.dueDate ?? undefined,
      projectId: ctx.projectId,
      authorId: previousState.authorId ?? ctx.userId ?? undefined,
    })
    .returning({ id: tasks.id });

  return {
    success: true,
    message: "Deleted task has been restored",
    restoredEntityId: created.id,
  };
}
