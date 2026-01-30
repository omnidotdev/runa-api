/**
 * reorderColumns tool definition.
 *
 * Reorder columns in the project board.
 */

import { eq } from "drizzle-orm";

import { dbPool } from "lib/db/db";
import { columns } from "lib/db/schema";

import type { WriteToolContext } from "../../core/context";
import type { ReorderColumnsInput } from "../../core/schemas";

export const REORDER_COLUMNS_DESCRIPTION =
  "Reorder columns (statuses) in the project board.";

export interface ReorderColumnsResult {
  columns: Array<{
    id: string;
    title: string;
    index: number;
  }>;
  previousOrder: Array<{
    id: string;
    index: number;
  }>;
}

export async function executeReorderColumns(
  input: ReorderColumnsInput,
  ctx: WriteToolContext,
): Promise<ReorderColumnsResult> {
  // Get all project columns
  const projectColumns = await dbPool.query.columns.findMany({
    where: eq(columns.projectId, ctx.projectId),
    columns: { id: true, title: true, index: true },
    orderBy: columns.index,
  });

  const projectColumnIds = new Set(projectColumns.map((c) => c.id));
  const inputColumnIds = new Set(input.columnIds);

  // Validate all input columns belong to this project
  for (const columnId of input.columnIds) {
    if (!projectColumnIds.has(columnId)) {
      throw new Error(`Column ${columnId} not found in this project.`);
    }
  }

  // Validate all project columns are included
  for (const column of projectColumns) {
    if (!inputColumnIds.has(column.id)) {
      throw new Error(
        `Missing column ${column.id} (${column.title}). All columns must be included in the reorder.`,
      );
    }
  }

  // Capture previous order
  const previousOrder = projectColumns.map((c) => ({
    id: c.id,
    index: c.index,
  }));

  // Update each column's index
  const updatedColumns: Array<{ id: string; title: string; index: number }> =
    [];

  for (let i = 0; i < input.columnIds.length; i++) {
    const columnId = input.columnIds[i];
    const column = projectColumns.find((c) => c.id === columnId);

    if (column && column.index !== i) {
      await dbPool
        .update(columns)
        .set({ index: i })
        .where(eq(columns.id, columnId));
    }

    if (column) {
      updatedColumns.push({
        id: column.id,
        title: column.title,
        index: i,
      });
    }
  }

  return {
    columns: updatedColumns,
    previousOrder,
  };
}
