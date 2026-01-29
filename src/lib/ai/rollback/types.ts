/**
 * Types for agent rollback operations.
 *
 * Snapshots capture the state of entities before write operations,
 * enabling undo functionality.
 */

/** Snapshot of a single task's state before modification. */
export interface TaskSnapshot {
  taskId: string;
  content: string;
  description: string;
  priority: string;
  columnId: string;
  columnIndex: number;
  dueDate: string | null;
  authorId: string | null;
}

/** Snapshot for single-entity operations. */
export interface SingleSnapshot {
  operation: string;
  entityType: string;
  entityId: string;
  previousState?: Record<string, unknown>;
}

/** Snapshot for batch operations affecting multiple tasks. */
export interface BatchSnapshot {
  operation: string;
  entityType: string;
  tasks: TaskSnapshot[];
}

export type Snapshot = SingleSnapshot | BatchSnapshot;

/** Type guard for batch snapshots. */
export function isBatchSnapshot(s: Snapshot): s is BatchSnapshot {
  return "tasks" in s && Array.isArray((s as BatchSnapshot).tasks);
}
