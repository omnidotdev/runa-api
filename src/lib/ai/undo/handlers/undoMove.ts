/**
 * Undo handler for move operations.
 *
 * Moves the task back to its previous column/position.
 */

import { eq } from "drizzle-orm";

import { dbPool } from "lib/db/db";
import { tasks } from "lib/db/schema";

import type { MoveSnapshot, UndoContext, UndoResult } from "../types";

export async function undoMove(
  snapshot: MoveSnapshot,
  _ctx: UndoContext,
): Promise<UndoResult> {
  if (snapshot.entityType !== "task") {
    return {
      success: false,
      message: `Undo not supported for entity type: ${snapshot.entityType}`,
    };
  }

  // Check if the task still exists
  const task = await dbPool.query.tasks.findFirst({
    where: eq(tasks.id, snapshot.entityId),
    columns: { id: true },
  });

  if (!task) {
    return {
      success: false,
      message: "Task has been deleted and cannot be moved back",
    };
  }

  const { previousState } = snapshot;

  await dbPool
    .update(tasks)
    .set({
      columnId: previousState.columnId,
      columnIndex: previousState.columnIndex,
    })
    .where(eq(tasks.id, snapshot.entityId));

  return {
    success: true,
    message: "Task moved back to previous column",
    restoredEntityId: snapshot.entityId,
  };
}
