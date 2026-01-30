/**
 * createColumns tool definition.
 *
 * Create one or more columns in the current project's board.
 * Uses sequential execution for index ordering.
 */

import { eq, max, min } from "drizzle-orm";

import { dbPool } from "lib/db/db";
import { columns } from "lib/db/schema";

import type { WriteToolContext } from "../../core/context";
import type { CreateColumnsInput } from "../../core/schemas";

export const CREATE_COLUMNS_DESCRIPTION =
  "Create one or more columns (statuses) in the project board.";

interface CreateColumnsResultItem {
  id: string;
  title: string;
  icon: string | null;
  index: number;
}

export interface CreateColumnsResult {
  createdCount: number;
  columns: CreateColumnsResultItem[];
  affectedIds: string[];
}

export async function executeCreateColumns(
  input: CreateColumnsInput,
  ctx: WriteToolContext,
): Promise<CreateColumnsResult> {
  const results: CreateColumnsResultItem[] = [];

  await dbPool.transaction(async (tx) => {
    for (const columnData of input.columns) {
      // Get the current max or min index for positioning
      let newIndex: number;

      if (columnData.position === "start") {
        const [result] = await tx
          .select({ minIndex: min(columns.index) })
          .from(columns)
          .where(eq(columns.projectId, ctx.projectId));
        newIndex = (result?.minIndex ?? 0) - 1;
      } else {
        const [result] = await tx
          .select({ maxIndex: max(columns.index) })
          .from(columns)
          .where(eq(columns.projectId, ctx.projectId));
        newIndex = (result?.maxIndex ?? -1) + 1;
      }

      const [created] = await tx
        .insert(columns)
        .values({
          title: columnData.title,
          icon: columnData.icon ?? null,
          projectId: ctx.projectId,
          index: newIndex,
        })
        .returning({
          id: columns.id,
          title: columns.title,
          icon: columns.icon,
          index: columns.index,
        });

      results.push({
        id: created.id,
        title: created.title,
        icon: created.icon,
        index: created.index,
      });
    }
  });

  return {
    createdCount: results.length,
    columns: results,
    affectedIds: results.map((c) => c.id),
  };
}
