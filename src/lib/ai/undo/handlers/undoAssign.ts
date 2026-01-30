/**
 * Undo handler for assign/unassign operations.
 *
 * Reverses the assignment action.
 */

import { and, eq } from "drizzle-orm";

import { dbPool } from "lib/db/db";
import { assignees } from "lib/db/schema";

import type { AssignSnapshot, UndoContext, UndoResult } from "../types";

export async function undoAssign(
  snapshot: AssignSnapshot,
  _ctx: UndoContext,
): Promise<UndoResult> {
  const { operation, previousState } = snapshot;
  const { taskId, userId } = previousState;

  if (operation === "assign") {
    // Undo assign = remove the assignment
    await dbPool
      .delete(assignees)
      .where(and(eq(assignees.taskId, taskId), eq(assignees.userId, userId)));

    return {
      success: true,
      message: "Assignment removed",
      restoredEntityId: taskId,
    };
  }

  if (operation === "unassign") {
    // Undo unassign = re-add the assignment
    // Check if already assigned (idempotent)
    const existing = await dbPool.query.assignees.findFirst({
      where: and(eq(assignees.taskId, taskId), eq(assignees.userId, userId)),
    });

    if (!existing) {
      await dbPool.insert(assignees).values({
        taskId,
        userId,
      });
    }

    return {
      success: true,
      message: "Assignment restored",
      restoredEntityId: taskId,
    };
  }

  return {
    success: false,
    message: `Unknown operation: ${operation}`,
  };
}
