/**
 * deleteColumn tool definition.
 *
 * Delete a column from the project board.
 * Tasks can be moved to another column or deleted.
 */

import { and, eq } from "drizzle-orm";

import { dbPool } from "lib/db/db";
import { columns, tasks } from "lib/db/schema";

import type { WriteToolContext } from "../../core/context";
import type { DeleteColumnInput } from "../../core/schemas";

export const DELETE_COLUMN_DESCRIPTION =
  "Delete a column (status) from the project board. Tasks can be moved to another column or deleted.";

export interface DeleteColumnResult {
  deletedColumnId: string;
  deletedColumnTitle: string;
  movedTasksCount: number;
  deletedTasksCount: number;
  snapshotBefore: {
    title: string;
    icon: string | null;
    index: number;
    taskIds: string[];
  };
}

export async function executeDeleteColumn(
  input: DeleteColumnInput,
  ctx: WriteToolContext,
): Promise<DeleteColumnResult> {
  // Verify column exists and belongs to this project
  const column = await dbPool.query.columns.findFirst({
    where: and(
      eq(columns.id, input.columnId),
      eq(columns.projectId, ctx.projectId),
    ),
    columns: { id: true, title: true, icon: true, index: true },
  });

  if (!column) {
    throw new Error(`Column ${input.columnId} not found in this project.`);
  }

  // Count project columns to prevent deleting the last one
  const columnCount = await dbPool
    .select({ id: columns.id })
    .from(columns)
    .where(eq(columns.projectId, ctx.projectId));

  if (columnCount.length <= 1) {
    throw new Error("Cannot delete the last column in a project.");
  }

  // Get tasks in this column
  const columnTasks = await dbPool.query.tasks.findMany({
    where: and(
      eq(tasks.columnId, input.columnId),
      eq(tasks.projectId, ctx.projectId),
    ),
    columns: { id: true },
  });

  const taskIds = columnTasks.map((t) => t.id);
  let movedTasksCount = 0;
  let deletedTasksCount = 0;

  // Handle tasks in the column
  if (taskIds.length > 0) {
    if (input.moveTasksTo) {
      // Verify target column exists
      const targetColumn = await dbPool.query.columns.findFirst({
        where: and(
          eq(columns.id, input.moveTasksTo),
          eq(columns.projectId, ctx.projectId),
        ),
        columns: { id: true },
      });

      if (!targetColumn) {
        throw new Error(
          `Target column ${input.moveTasksTo} not found in this project.`,
        );
      }

      if (targetColumn.id === input.columnId) {
        throw new Error("Cannot move tasks to the same column being deleted.");
      }

      // Move tasks to target column
      await dbPool
        .update(tasks)
        .set({ columnId: input.moveTasksTo })
        .where(eq(tasks.columnId, input.columnId));

      movedTasksCount = taskIds.length;
    } else {
      // Delete tasks in the column
      await dbPool.delete(tasks).where(eq(tasks.columnId, input.columnId));
      deletedTasksCount = taskIds.length;
    }
  }

  // Capture snapshot before deletion
  const snapshotBefore = {
    title: column.title,
    icon: column.icon,
    index: column.index,
    taskIds,
  };

  // Delete the column
  await dbPool.delete(columns).where(eq(columns.id, input.columnId));

  return {
    deletedColumnId: column.id,
    deletedColumnTitle: column.title,
    movedTasksCount,
    deletedTasksCount,
    snapshotBefore,
  };
}
