/**
 * Undo system for agent activities.
 *
 * Provides the ability to undo recent agent actions by restoring
 * entities to their previous state using snapshots.
 */

import { eq } from "drizzle-orm";

import { dbPool } from "lib/db/db";
import { agentActivities } from "lib/db/schema";
import { undoAssign } from "./handlers/undoAssign";
import {
  undoBatchDelete,
  undoBatchMove,
  undoBatchUpdate,
} from "./handlers/undoBatch";
import { undoComment } from "./handlers/undoComment";
import { undoCreate } from "./handlers/undoCreate";
import { undoDelete } from "./handlers/undoDelete";
import { undoLabel } from "./handlers/undoLabel";
import { undoMove } from "./handlers/undoMove";
import { undoUpdate } from "./handlers/undoUpdate";
import { canUndoActivity } from "./types";

import type { SelectAgentActivity } from "lib/db/schema";
import type { ActivitySnapshot, UndoContext, UndoResult } from "./types";

export { UNDO_WINDOW_MS, canUndoActivity } from "./types";

/**
 * Execute an undo operation for an activity.
 *
 * Validates the activity can be undone, dispatches to the appropriate handler,
 * and updates the activity status to 'rolled_back'.
 */
export async function executeUndo(
  activity: SelectAgentActivity,
  ctx: UndoContext,
): Promise<UndoResult> {
  // Validate the activity can be undone
  const { canUndo, reason } = canUndoActivity(activity);
  if (!canUndo) {
    return {
      success: false,
      message: reason ?? "Cannot undo this activity",
    };
  }

  // Validate user permission (must be same user or have editor access)
  if (activity.userId !== ctx.userId) {
    return {
      success: false,
      message: "You can only undo your own actions",
    };
  }

  const snapshot = activity.snapshotBefore as ActivitySnapshot;

  // Dispatch to the appropriate handler
  let result: UndoResult;
  try {
    switch (snapshot.operation) {
      case "create":
        result = await undoCreate(snapshot, ctx);
        break;

      case "update":
        result = await undoUpdate(snapshot, ctx);
        break;

      case "move":
        result = await undoMove(snapshot, ctx);
        break;

      case "delete":
        result = await undoDelete(snapshot, ctx);
        break;

      case "batchDelete":
        result = await undoBatchDelete(snapshot, ctx);
        break;

      case "batchMove":
        result = await undoBatchMove(snapshot, ctx);
        break;

      case "batchUpdate":
        result = await undoBatchUpdate(snapshot, ctx);
        break;

      case "assign":
      case "unassign":
        result = await undoAssign(snapshot, ctx);
        break;

      case "addLabel":
      case "removeLabel":
        result = await undoLabel(snapshot, ctx);
        break;

      case "addComment":
        result = await undoComment(snapshot, ctx);
        break;

      default:
        result = {
          success: false,
          message: `Unknown operation: ${(snapshot as ActivitySnapshot).operation}`,
        };
    }
  } catch (error) {
    console.error("[Undo] Handler error:", error);
    result = {
      success: false,
      message: error instanceof Error ? error.message : "Undo operation failed",
    };
  }

  // If successful, mark the activity as rolled back
  if (result.success) {
    await dbPool
      .update(agentActivities)
      .set({ status: "rolled_back" })
      .where(eq(agentActivities.id, activity.id));
  }

  return result;
}
