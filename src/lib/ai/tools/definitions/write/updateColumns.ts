/**
 * updateColumns tool definition.
 *
 * Update one or more columns' title, icon, or index (for reordering).
 * Uses sequential execution for index updates to maintain ordering.
 */

import { and, eq } from "drizzle-orm";

import { dbPool } from "lib/db/db";
import { columns } from "lib/db/schema";

import type { WriteToolContext } from "../../core/context";
import type { UpdateColumnsInput } from "../../core/schemas";

export const UPDATE_COLUMNS_DESCRIPTION =
  "Update one or more columns' title, icon, or position in the project board.";

interface UpdateColumnsResultItem {
  id: string;
  title: string;
  icon: string | null;
  index: number;
}

interface UpdateColumnsSnapshotItem {
  columnId: string;
  title: string;
  icon: string | null;
  index: number;
}

export interface UpdateColumnsResult {
  updatedCount: number;
  columns: UpdateColumnsResultItem[];
  affectedIds: string[];
  snapshotBefore: UpdateColumnsSnapshotItem[];
}

export async function executeUpdateColumns(
  input: UpdateColumnsInput,
  ctx: WriteToolContext,
): Promise<UpdateColumnsResult> {
  // Collect column IDs for batch validation
  const columnIds = input.updates.map((u) => u.columnId);

  // Validate all columns exist and belong to this project
  const existingColumns = await dbPool.query.columns.findMany({
    where: and(eq(columns.projectId, ctx.projectId)),
    columns: { id: true, title: true, icon: true, index: true },
    orderBy: columns.index,
  });

  const columnMap = new Map(existingColumns.map((c) => [c.id, c]));

  // Validate all columns exist
  for (const colId of columnIds) {
    if (!columnMap.has(colId)) {
      throw new Error(`Column ${colId} not found in this project.`);
    }
  }

  // Snapshot before updates
  const snapshotBefore: UpdateColumnsSnapshotItem[] = input.updates.map((u) => {
    const col = columnMap.get(u.columnId)!;
    return {
      columnId: col.id,
      title: col.title,
      icon: col.icon,
      index: col.index,
    };
  });

  // Execute updates
  const results: UpdateColumnsResultItem[] = [];

  await dbPool.transaction(async (tx) => {
    // Check if any updates include index changes (reordering)
    const hasIndexChanges = input.updates.some((u) => u.index !== undefined);

    if (hasIndexChanges) {
      // For reordering, we need to update all columns to avoid index conflicts
      // Build the target order based on updates
      const targetOrder = [...existingColumns];

      for (const update of input.updates) {
        if (update.index !== undefined) {
          const col = targetOrder.find((c) => c.id === update.columnId);
          if (col) {
            // Remove from current position
            const currentIdx = targetOrder.indexOf(col);
            targetOrder.splice(currentIdx, 1);
            // Insert at new position
            const insertIdx = Math.min(update.index, targetOrder.length);
            targetOrder.splice(insertIdx, 0, col);
          }
        }
      }

      // Update all columns with their new indices
      for (let i = 0; i < targetOrder.length; i++) {
        const col = targetOrder[i];
        const update = input.updates.find((u) => u.columnId === col.id);

        const patch: Record<string, unknown> = { index: i };

        if (update?.title !== undefined) {
          patch.title = update.title;
        }
        if (update?.icon !== undefined) {
          patch.icon = update.icon;
        }

        await tx.update(columns).set(patch).where(eq(columns.id, col.id));

        // Only include in results if it was in the input
        if (update) {
          results.push({
            id: col.id,
            title: (patch.title as string) ?? col.title,
            icon:
              patch.icon !== undefined
                ? (patch.icon as string | null)
                : col.icon,
            index: i,
          });
        }
      }
    } else {
      // No index changes - simple parallel field updates
      for (const update of input.updates) {
        const col = columnMap.get(update.columnId)!;

        const patch: Record<string, unknown> = {};
        if (update.title !== undefined) patch.title = update.title;
        if (update.icon !== undefined) patch.icon = update.icon;

        if (Object.keys(patch).length > 0) {
          const [updated] = await tx
            .update(columns)
            .set(patch)
            .where(eq(columns.id, update.columnId))
            .returning({
              id: columns.id,
              title: columns.title,
              icon: columns.icon,
              index: columns.index,
            });

          results.push(updated);
        } else {
          results.push({
            id: col.id,
            title: col.title,
            icon: col.icon,
            index: col.index,
          });
        }
      }
    }
  });

  return {
    updatedCount: results.length,
    columns: results,
    affectedIds: results.map((c) => c.id),
    snapshotBefore,
  };
}
