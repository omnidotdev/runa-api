/**
 * Undo handlers for batch operations.
 *
 * Handles batch delete, move, and update operations.
 */

import { eq, inArray } from "drizzle-orm";

import { dbPool } from "lib/db/db";
import { tasks } from "lib/db/schema";

import type {
  BatchDeleteSnapshot,
  BatchMoveSnapshot,
  BatchUpdateSnapshot,
  UndoContext,
  UndoResult,
} from "../types";

export async function undoBatchDelete(
  snapshot: BatchDeleteSnapshot,
  ctx: UndoContext,
): Promise<UndoResult> {
  if (!snapshot.tasks || snapshot.tasks.length === 0) {
    return {
      success: false,
      message: "No tasks in snapshot to restore",
    };
  }

  const restoredIds: string[] = [];

  // Recreate each deleted task
  for (const taskData of snapshot.tasks) {
    const [created] = await dbPool
      .insert(tasks)
      .values({
        content: taskData.content,
        description: taskData.description ?? "",
        priority: taskData.priority,
        columnId: taskData.columnId,
        columnIndex: taskData.columnIndex,
        dueDate: taskData.dueDate ?? undefined,
        projectId: ctx.projectId,
        authorId: taskData.authorId ?? ctx.userId ?? undefined,
      })
      .returning({ id: tasks.id });

    restoredIds.push(created.id);
  }

  return {
    success: true,
    message: `Restored ${restoredIds.length} deleted tasks`,
    restoredEntityIds: restoredIds,
  };
}

export async function undoBatchMove(
  snapshot: BatchMoveSnapshot,
  _ctx: UndoContext,
): Promise<UndoResult> {
  if (!snapshot.tasks || snapshot.tasks.length === 0) {
    return {
      success: false,
      message: "No tasks in snapshot to restore",
    };
  }

  const taskIds = snapshot.tasks.map((t) => t.id);

  // Check which tasks still exist
  const existingTasks = await dbPool.query.tasks.findMany({
    where: inArray(tasks.id, taskIds),
    columns: { id: true },
  });
  const existingIds = new Set(existingTasks.map((t) => t.id));

  const restoredIds: string[] = [];

  // Move each task back to its original position
  for (const taskData of snapshot.tasks) {
    if (!existingIds.has(taskData.id)) continue;

    await dbPool
      .update(tasks)
      .set({
        columnId: taskData.columnId,
        columnIndex: taskData.columnIndex,
      })
      .where(eq(tasks.id, taskData.id));

    restoredIds.push(taskData.id);
  }

  if (restoredIds.length === 0) {
    return {
      success: false,
      message: "All tasks have been deleted",
    };
  }

  return {
    success: true,
    message: `Moved ${restoredIds.length} tasks back to original positions`,
    restoredEntityIds: restoredIds,
  };
}

export async function undoBatchUpdate(
  snapshot: BatchUpdateSnapshot,
  _ctx: UndoContext,
): Promise<UndoResult> {
  if (!snapshot.tasks || snapshot.tasks.length === 0) {
    return {
      success: false,
      message: "No tasks in snapshot to restore",
    };
  }

  const taskIds = snapshot.tasks.map((t) => t.id);

  // Check which tasks still exist
  const existingTasks = await dbPool.query.tasks.findMany({
    where: inArray(tasks.id, taskIds),
    columns: { id: true },
  });
  const existingIds = new Set(existingTasks.map((t) => t.id));

  const restoredIds: string[] = [];

  // Restore each task to its previous state
  for (const taskData of snapshot.tasks) {
    if (!existingIds.has(taskData.id)) continue;

    await dbPool
      .update(tasks)
      .set({
        content: taskData.content,
        description: taskData.description ?? "",
        priority: taskData.priority,
        dueDate: taskData.dueDate ?? undefined,
      })
      .where(eq(tasks.id, taskData.id));

    restoredIds.push(taskData.id);
  }

  if (restoredIds.length === 0) {
    return {
      success: false,
      message: "All tasks have been deleted",
    };
  }

  return {
    success: true,
    message: `Restored ${restoredIds.length} tasks to previous state`,
    restoredEntityIds: restoredIds,
  };
}
