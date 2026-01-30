/**
 * deleteColumns tool definition.
 *
 * Delete one or more columns from the project board.
 * Tasks can be moved to another column or deleted.
 * Uses sequential execution to handle task movements properly.
 */

import { and, eq } from "drizzle-orm";

import { dbPool } from "lib/db/db";
import { columns, tasks } from "lib/db/schema";

import type { WriteToolContext } from "../../core/context";
import type { DeleteColumnsInput } from "../../core/schemas";

export const DELETE_COLUMNS_DESCRIPTION =
  "Delete one or more columns (statuses) from the project board. Tasks can be moved to another column or deleted.";

interface DeleteColumnsResultItem {
  deletedColumnId: string;
  deletedColumnTitle: string;
  movedTasksCount: number;
  deletedTasksCount: number;
}

interface DeleteColumnsSnapshotItem {
  columnId: string;
  title: string;
  icon: string | null;
  index: number;
  taskIds: string[];
}

export interface DeleteColumnsResult {
  deletedCount: number;
  columns: DeleteColumnsResultItem[];
  affectedIds: string[];
  snapshotBefore: DeleteColumnsSnapshotItem[];
}

export async function executeDeleteColumns(
  input: DeleteColumnsInput,
  ctx: WriteToolContext,
): Promise<DeleteColumnsResult> {
  // Get all project columns for validation
  const projectColumns = await dbPool.query.columns.findMany({
    where: eq(columns.projectId, ctx.projectId),
    columns: { id: true, title: true, icon: true, index: true },
  });

  const columnMap = new Map(projectColumns.map((c) => [c.id, c]));
  const columnIds = input.columns.map((c) => c.columnId);

  // Validate all columns exist
  for (const colId of columnIds) {
    if (!columnMap.has(colId)) {
      throw new Error(`Column ${colId} not found in this project.`);
    }
  }

  // Validate we're not deleting all columns
  const remainingColumns = projectColumns.filter(
    (c) => !columnIds.includes(c.id),
  );
  if (remainingColumns.length === 0) {
    throw new Error("Cannot delete all columns. At least one must remain.");
  }

  // Validate moveTasksTo targets exist and are not being deleted
  for (const deletion of input.columns) {
    if (deletion.moveTasksTo) {
      if (!columnMap.has(deletion.moveTasksTo)) {
        throw new Error(
          `Target column ${deletion.moveTasksTo} not found in this project.`,
        );
      }
      if (columnIds.includes(deletion.moveTasksTo)) {
        throw new Error(
          `Cannot move tasks to column ${deletion.moveTasksTo} which is also being deleted.`,
        );
      }
    }
  }

  // Get tasks in columns to be deleted
  const columnTasksMap = new Map<string, string[]>();
  for (const colId of columnIds) {
    const columnTasks = await dbPool.query.tasks.findMany({
      where: and(eq(tasks.columnId, colId), eq(tasks.projectId, ctx.projectId)),
      columns: { id: true },
    });
    columnTasksMap.set(
      colId,
      columnTasks.map((t) => t.id),
    );
  }

  // Snapshot before deletes
  const snapshotBefore: DeleteColumnsSnapshotItem[] = input.columns.map((d) => {
    const col = columnMap.get(d.columnId)!;
    return {
      columnId: col.id,
      title: col.title,
      icon: col.icon,
      index: col.index,
      taskIds: columnTasksMap.get(col.id) ?? [],
    };
  });

  // Execute deletions
  const results: DeleteColumnsResultItem[] = [];

  await dbPool.transaction(async (tx) => {
    for (const deletion of input.columns) {
      const col = columnMap.get(deletion.columnId)!;
      const taskIds = columnTasksMap.get(deletion.columnId) ?? [];

      let movedTasksCount = 0;
      let deletedTasksCount = 0;

      // Handle tasks in the column
      if (taskIds.length > 0) {
        if (deletion.moveTasksTo) {
          // Move tasks to target column
          await tx
            .update(tasks)
            .set({ columnId: deletion.moveTasksTo })
            .where(eq(tasks.columnId, deletion.columnId));
          movedTasksCount = taskIds.length;
        } else {
          // Delete tasks in the column
          await tx.delete(tasks).where(eq(tasks.columnId, deletion.columnId));
          deletedTasksCount = taskIds.length;
        }
      }

      // Delete the column
      await tx.delete(columns).where(eq(columns.id, deletion.columnId));

      results.push({
        deletedColumnId: col.id,
        deletedColumnTitle: col.title,
        movedTasksCount,
        deletedTasksCount,
      });
    }
  });

  return {
    deletedCount: results.length,
    columns: results,
    affectedIds: results.map((r) => r.deletedColumnId),
    snapshotBefore,
  };
}
