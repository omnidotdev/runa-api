/**
 * updateColumn tool definition.
 *
 * Update a column's title or icon.
 */

import { and, eq } from "drizzle-orm";

import { dbPool } from "lib/db/db";
import { columns } from "lib/db/schema";

import type { WriteToolContext } from "../../core/context";
import type { UpdateColumnInput } from "../../core/schemas";

export const UPDATE_COLUMN_DESCRIPTION =
  "Update a column's title or icon in the project board.";

export interface UpdateColumnResult {
  column: {
    id: string;
    title: string;
    icon: string | null;
  };
  previousState: {
    title: string;
    icon: string | null;
  };
}

export async function executeUpdateColumn(
  input: UpdateColumnInput,
  ctx: WriteToolContext,
): Promise<UpdateColumnResult> {
  // Verify column exists and belongs to this project
  const existing = await dbPool.query.columns.findFirst({
    where: and(
      eq(columns.id, input.columnId),
      eq(columns.projectId, ctx.projectId),
    ),
    columns: { id: true, title: true, icon: true },
  });

  if (!existing) {
    throw new Error(`Column ${input.columnId} not found in this project.`);
  }

  const previousState = {
    title: existing.title,
    icon: existing.icon,
  };

  // Build update object
  const updates: Partial<{ title: string; icon: string | null }> = {};
  if (input.title !== undefined) {
    updates.title = input.title;
  }
  if (input.icon !== undefined) {
    updates.icon = input.icon;
  }

  if (Object.keys(updates).length === 0) {
    // Nothing to update
    return {
      column: {
        id: existing.id,
        title: existing.title,
        icon: existing.icon,
      },
      previousState,
    };
  }

  const [updated] = await dbPool
    .update(columns)
    .set(updates)
    .where(eq(columns.id, input.columnId))
    .returning({
      id: columns.id,
      title: columns.title,
      icon: columns.icon,
    });

  return {
    column: {
      id: updated.id,
      title: updated.title,
      icon: updated.icon,
    },
    previousState,
  };
}
