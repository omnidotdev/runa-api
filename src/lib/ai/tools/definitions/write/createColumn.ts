/**
 * createColumn tool definition.
 *
 * Create a new column in the current project's board.
 */

import { eq, max, min } from "drizzle-orm";

import { dbPool } from "lib/db/db";
import { columns } from "lib/db/schema";

import type { WriteToolContext } from "../../core/context";
import type { CreateColumnInput } from "../../core/schemas";

export const CREATE_COLUMN_DESCRIPTION =
  "Create a new column (status) in the project board.";

export interface CreateColumnResult {
  column: {
    id: string;
    title: string;
    icon: string | null;
    index: number;
  };
}

export async function executeCreateColumn(
  input: CreateColumnInput,
  ctx: WriteToolContext,
): Promise<CreateColumnResult> {
  // Get the current max or min index for positioning
  let newIndex: number;

  if (input.position === "start") {
    const [result] = await dbPool
      .select({ minIndex: min(columns.index) })
      .from(columns)
      .where(eq(columns.projectId, ctx.projectId));
    newIndex = (result?.minIndex ?? 0) - 1;
  } else {
    const [result] = await dbPool
      .select({ maxIndex: max(columns.index) })
      .from(columns)
      .where(eq(columns.projectId, ctx.projectId));
    newIndex = (result?.maxIndex ?? -1) + 1;
  }

  const [created] = await dbPool
    .insert(columns)
    .values({
      title: input.title,
      icon: input.icon ?? null,
      projectId: ctx.projectId,
      index: newIndex,
    })
    .returning({
      id: columns.id,
      title: columns.title,
      icon: columns.icon,
      index: columns.index,
    });

  return {
    column: {
      id: created.id,
      title: created.title,
      icon: created.icon,
      index: created.index,
    },
  };
}
