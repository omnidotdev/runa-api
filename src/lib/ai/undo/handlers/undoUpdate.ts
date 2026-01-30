/**
 * Undo handler for update operations.
 *
 * Restores the entity to its previous state.
 */

import { eq } from "drizzle-orm";

import { dbPool } from "lib/db/db";
import { tasks } from "lib/db/schema";

import type { UndoContext, UndoResult, UpdateSnapshot } from "../types";

export async function undoUpdate(
  snapshot: UpdateSnapshot,
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
      message: "Task has been deleted and cannot be restored",
    };
  }

  const { previousState } = snapshot;

  await dbPool
    .update(tasks)
    .set({
      content: previousState.content,
      description: previousState.description ?? "",
      priority: previousState.priority,
      dueDate: previousState.dueDate ?? undefined,
    })
    .where(eq(tasks.id, snapshot.entityId));

  return {
    success: true,
    message: "Task restored to previous state",
    restoredEntityId: snapshot.entityId,
  };
}
