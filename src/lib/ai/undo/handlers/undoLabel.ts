/**
 * Undo handler for label operations.
 *
 * Reverses the add/remove label action.
 */

import { and, eq } from "drizzle-orm";

import { dbPool } from "lib/db/db";
import { taskLabels } from "lib/db/schema";

import type { LabelSnapshot, UndoContext, UndoResult } from "../types";

export async function undoLabel(
  snapshot: LabelSnapshot,
  _ctx: UndoContext,
): Promise<UndoResult> {
  const { operation, previousState } = snapshot;
  const { taskId, labelId } = previousState;

  if (operation === "addLabel") {
    // Undo addLabel = remove the label
    await dbPool
      .delete(taskLabels)
      .where(
        and(eq(taskLabels.taskId, taskId), eq(taskLabels.labelId, labelId)),
      );

    return {
      success: true,
      message: "Label removed from task",
      restoredEntityId: taskId,
    };
  }

  if (operation === "removeLabel") {
    // Undo removeLabel = re-add the label
    // Check if already added (idempotent)
    const existing = await dbPool.query.taskLabels.findFirst({
      where: and(
        eq(taskLabels.taskId, taskId),
        eq(taskLabels.labelId, labelId),
      ),
    });

    if (!existing) {
      await dbPool.insert(taskLabels).values({
        taskId,
        labelId,
      });
    }

    return {
      success: true,
      message: "Label restored to task",
      restoredEntityId: taskId,
    };
  }

  return {
    success: false,
    message: `Unknown operation: ${operation}`,
  };
}
