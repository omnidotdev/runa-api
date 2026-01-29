/**
 * Rollback logic for reverting agent operations.
 *
 * These functions apply snapshot-based rollbacks within database
 * transactions, enabling undo functionality for all agent write tools.
 */

import { and, eq } from "drizzle-orm";

import { assignees, posts, projects, taskLabels, tasks } from "lib/db/schema";
import { isBatchSnapshot } from "./types";

import type { dbPool } from "lib/db/db";
import type { BatchSnapshot, SingleSnapshot, Snapshot } from "./types";

/** Transaction type from drizzle-orm. */
type Transaction = Parameters<Parameters<typeof dbPool.transaction>[0]>[0];

/**
 * Apply a single snapshot rollback inside a transaction.
 *
 * `projectId` is passed separately because delete/batchDelete snapshots
 * don't store it — it's sourced from the parent activity record.
 *
 * Returns a human-readable description of the rollback action.
 * Throws for unsupported or malformed snapshots.
 */
export async function applyRollback(
  snapshot: Snapshot,
  tx: Transaction,
  projectId: string,
): Promise<string> {
  if (isBatchSnapshot(snapshot)) {
    return applyBatchRollback(snapshot, tx, projectId);
  }

  return applySingleRollback(snapshot, tx, projectId);
}

/**
 * Apply single-entity rollback operations.
 */
async function applySingleRollback(
  snapshot: SingleSnapshot,
  tx: Transaction,
  projectId: string,
): Promise<string> {
  const { operation, entityType, entityId, previousState } = snapshot;

  switch (operation) {
    case "create": {
      if (entityType === "task") {
        await tx.delete(tasks).where(eq(tasks.id, entityId));
        return `Deleted task ${entityId}`;
      }
      throw new Error(
        `Unsupported entity type for create rollback: ${entityType}`,
      );
    }

    case "createProject": {
      if (entityType === "project") {
        // Delete the project - FK cascades will handle columns, labels, tasks
        await tx.delete(projects).where(eq(projects.id, entityId));
        return `Deleted project ${entityId} and all associated data`;
      }
      throw new Error(
        `Unsupported entity type for createProject rollback: ${entityType}`,
      );
    }

    case "update": {
      if (entityType === "task" && previousState) {
        const patch: Record<string, unknown> = {};
        if (previousState.content !== undefined)
          patch.content = previousState.content;
        if (previousState.description !== undefined)
          patch.description = previousState.description;
        if (previousState.priority !== undefined)
          patch.priority = previousState.priority;
        if (previousState.dueDate !== undefined)
          patch.dueDate = previousState.dueDate;

        if (Object.keys(patch).length > 0) {
          await tx.update(tasks).set(patch).where(eq(tasks.id, entityId));
        }
        return `Restored task ${entityId} to previous state`;
      }
      throw new Error(
        `Unsupported entity type for update rollback: ${entityType}`,
      );
    }

    case "move": {
      if (entityType === "task" && previousState) {
        await tx
          .update(tasks)
          .set({
            columnId: previousState.columnId as string,
            columnIndex: previousState.columnIndex as number,
          })
          .where(eq(tasks.id, entityId));
        return `Moved task ${entityId} back to previous column`;
      }
      throw new Error(
        `Unsupported entity type for move rollback: ${entityType}`,
      );
    }

    case "delete": {
      if (entityType === "task" && previousState) {
        await tx.insert(tasks).values({
          id: entityId,
          content: previousState.content as string,
          description: (previousState.description as string) ?? "",
          priority: (previousState.priority as string) ?? "medium",
          columnId: previousState.columnId as string,
          columnIndex: (previousState.columnIndex as number) ?? 0,
          dueDate: (previousState.dueDate as string) ?? null,
          authorId: (previousState.authorId as string) ?? null,
          projectId,
        });
        return `Re-created deleted task ${entityId}`;
      }
      throw new Error(
        `Unsupported entity type for delete rollback: ${entityType}`,
      );
    }

    case "assign": {
      if (entityType === "assignee" && previousState) {
        await tx
          .delete(assignees)
          .where(
            and(
              eq(assignees.taskId, previousState.taskId as string),
              eq(assignees.userId, previousState.userId as string),
            ),
          );
        return `Removed assignee from task ${previousState.taskId}`;
      }
      throw new Error(
        `Unsupported entity type for assign rollback: ${entityType}`,
      );
    }

    case "unassign": {
      if (entityType === "assignee" && previousState) {
        await tx
          .insert(assignees)
          .values({
            taskId: previousState.taskId as string,
            userId: previousState.userId as string,
          })
          .onConflictDoNothing();
        return `Re-assigned user to task ${previousState.taskId}`;
      }
      throw new Error(
        `Unsupported entity type for unassign rollback: ${entityType}`,
      );
    }

    case "addLabel": {
      if (entityType === "taskLabel" && previousState) {
        await tx
          .delete(taskLabels)
          .where(
            and(
              eq(taskLabels.taskId, previousState.taskId as string),
              eq(taskLabels.labelId, previousState.labelId as string),
            ),
          );
        return `Removed label from task ${previousState.taskId}`;
      }
      throw new Error(
        `Unsupported entity type for addLabel rollback: ${entityType}`,
      );
    }

    case "removeLabel": {
      if (entityType === "taskLabel" && previousState) {
        await tx
          .insert(taskLabels)
          .values({
            taskId: previousState.taskId as string,
            labelId: previousState.labelId as string,
          })
          .onConflictDoNothing();
        return `Re-added label to task ${previousState.taskId}`;
      }
      throw new Error(
        `Unsupported entity type for removeLabel rollback: ${entityType}`,
      );
    }

    case "addComment": {
      if (entityType === "comment") {
        await tx.delete(posts).where(eq(posts.id, entityId));
        return `Deleted comment ${entityId}`;
      }
      throw new Error(
        `Unsupported entity type for addComment rollback: ${entityType}`,
      );
    }

    default:
      throw new Error(`Unsupported rollback operation: ${operation}`);
  }
}

/**
 * Apply batch rollback for batch operations (batchMove, batchUpdate, batchDelete).
 * Throws for unsupported batch operations.
 */
async function applyBatchRollback(
  snapshot: BatchSnapshot,
  tx: Transaction,
  projectId: string,
): Promise<string> {
  const { operation, tasks: taskSnapshots } = snapshot;

  switch (operation) {
    case "batchMove": {
      for (const snap of taskSnapshots) {
        await tx
          .update(tasks)
          .set({
            columnId: snap.columnId,
            columnIndex: snap.columnIndex,
          })
          .where(eq(tasks.id, snap.taskId));
      }
      return `Moved ${taskSnapshots.length} tasks back to previous columns`;
    }

    case "batchUpdate": {
      for (const snap of taskSnapshots) {
        await tx
          .update(tasks)
          .set({
            priority: snap.priority,
            dueDate: snap.dueDate,
          })
          .where(eq(tasks.id, snap.taskId));
      }
      return `Restored ${taskSnapshots.length} tasks to previous state`;
    }

    case "batchDelete": {
      for (const snap of taskSnapshots) {
        await tx.insert(tasks).values({
          id: snap.taskId,
          content: snap.content,
          description: snap.description ?? "",
          priority: snap.priority ?? "medium",
          columnId: snap.columnId,
          columnIndex: snap.columnIndex ?? 0,
          dueDate: snap.dueDate ?? null,
          authorId: snap.authorId ?? null,
          projectId,
        });
      }
      return `Re-created ${taskSnapshots.length} deleted tasks`;
    }

    default:
      throw new Error(`Unsupported batch rollback operation: ${operation}`);
  }
}
