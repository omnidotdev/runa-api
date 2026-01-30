/**
 * Undo handler for create operations.
 *
 * Deletes the created entity.
 */

import { eq } from "drizzle-orm";

import { dbPool } from "lib/db/db";
import { tasks } from "lib/db/schema";

import type { CreateSnapshot, UndoContext, UndoResult } from "../types";

export async function undoCreate(
  snapshot: CreateSnapshot,
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
      message: "Task has already been deleted",
    };
  }

  await dbPool.delete(tasks).where(eq(tasks.id, snapshot.entityId));

  return {
    success: true,
    message: "Task creation undone (task deleted)",
    restoredEntityId: snapshot.entityId,
  };
}
