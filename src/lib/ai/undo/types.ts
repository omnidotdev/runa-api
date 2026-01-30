/**
 * Types for the undo system.
 */

import type { SelectAgentActivity } from "lib/db/schema";

/** Snapshot structure for create operations. */
export interface CreateSnapshot {
  operation: "create";
  entityType: "task";
  entityId: string;
}

/** Snapshot structure for update operations. */
export interface UpdateSnapshot {
  operation: "update";
  entityType: "task";
  entityId: string;
  previousState: {
    content: string;
    description: string | null;
    priority: string;
    dueDate: string | null;
  };
}

/** Snapshot structure for move operations. */
export interface MoveSnapshot {
  operation: "move";
  entityType: "task";
  entityId: string;
  previousState: {
    columnId: string;
    columnIndex: number;
  };
}

/** Snapshot structure for delete operations. */
export interface DeleteSnapshot {
  operation: "delete";
  entityType: "task";
  entityId: string;
  previousState: {
    content: string;
    description: string | null;
    priority: string;
    columnId: string;
    columnIndex: number;
    dueDate: string | null;
    authorId: string | null;
  };
}

/** Snapshot structure for batch delete operations. */
export interface BatchDeleteSnapshot {
  operation: "batchDelete";
  entityType: "task";
  tasks: Array<{
    id: string;
    content: string;
    description: string | null;
    priority: string;
    columnId: string;
    columnIndex: number;
    dueDate: string | null;
    authorId: string | null;
  }>;
}

/** Snapshot structure for batch move operations. */
export interface BatchMoveSnapshot {
  operation: "batchMove";
  entityType: "task";
  tasks: Array<{
    id: string;
    columnId: string;
    columnIndex: number;
  }>;
}

/** Snapshot structure for batch update operations. */
export interface BatchUpdateSnapshot {
  operation: "batchUpdate";
  entityType: "task";
  tasks: Array<{
    id: string;
    content: string;
    description: string | null;
    priority: string;
    dueDate: string | null;
  }>;
}

/** Snapshot structure for assign/unassign operations. */
export interface AssignSnapshot {
  operation: "assign" | "unassign";
  entityType: "assignee";
  entityId: string;
  previousState: {
    taskId: string;
    userId: string;
  };
}

/** Snapshot structure for label operations. */
export interface LabelSnapshot {
  operation: "addLabel" | "removeLabel";
  entityType: "taskLabel";
  entityId: string;
  previousState: {
    taskId: string;
    labelId: string;
  };
}

/** Snapshot structure for comment operations. */
export interface CommentSnapshot {
  operation: "addComment";
  entityType: "comment";
  entityId: string;
}

/** Union of all snapshot types. */
export type ActivitySnapshot =
  | CreateSnapshot
  | UpdateSnapshot
  | MoveSnapshot
  | DeleteSnapshot
  | BatchDeleteSnapshot
  | BatchMoveSnapshot
  | BatchUpdateSnapshot
  | AssignSnapshot
  | LabelSnapshot
  | CommentSnapshot;

/** Context for undo operations. */
export interface UndoContext {
  userId: string;
  organizationId: string;
  projectId: string;
}

/** Result of an undo operation. */
export interface UndoResult {
  success: boolean;
  message: string;
  restoredEntityId?: string;
  restoredEntityIds?: string[];
}

/** Time window for undo operations (5 minutes). */
export const UNDO_WINDOW_MS = 5 * 60 * 1000;

/** Operations that can be undone. */
const UNDOABLE_OPERATIONS = new Set([
  "create",
  "update",
  "move",
  "delete",
  "batchDelete",
  "batchMove",
  "batchUpdate",
  "assign",
  "unassign",
  "addLabel",
  "removeLabel",
  "addComment",
]);

/** Check if an activity is within the undo window. */
function isWithinUndoWindow(activity: SelectAgentActivity): boolean {
  const createdAt = new Date(activity.createdAt).getTime();
  const now = Date.now();
  return now - createdAt < UNDO_WINDOW_MS;
}

/** Check if an activity can be undone. */
export function canUndoActivity(activity: SelectAgentActivity): {
  canUndo: boolean;
  reason?: string;
} {
  if (activity.status === "rolled_back") {
    return { canUndo: false, reason: "Activity has already been undone" };
  }

  if (activity.status !== "completed") {
    return {
      canUndo: false,
      reason: "Only completed activities can be undone",
    };
  }

  if (!activity.snapshotBefore) {
    return { canUndo: false, reason: "No snapshot available for undo" };
  }

  if (!isWithinUndoWindow(activity)) {
    return { canUndo: false, reason: "Undo window has expired (5 minutes)" };
  }

  const snapshot = activity.snapshotBefore as ActivitySnapshot;
  if (!UNDOABLE_OPERATIONS.has(snapshot.operation)) {
    return { canUndo: false, reason: "This operation cannot be undone" };
  }

  return { canUndo: true };
}
