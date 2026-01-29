/**
 * removeLabel tool definition.
 *
 * Remove a label from a task.
 */

import { and, eq } from "drizzle-orm";

import { dbPool } from "lib/db/db";
import { taskLabels } from "lib/db/schema";
import { resolveLabel, resolveTask } from "../../core/helpers";

import type { WriteToolContext } from "../../core/context";
import type { RemoveLabelInput } from "../../core/schemas";

export const REMOVE_LABEL_DESCRIPTION = "Remove a label from a task.";

export interface RemoveLabelResult {
  taskId: string;
  taskNumber: number | null;
  taskTitle: string;
  labelId: string;
  labelName: string;
}

export async function executeRemoveLabel(
  input: RemoveLabelInput,
  ctx: WriteToolContext,
): Promise<RemoveLabelResult> {
  const task = await resolveTask(input, ctx.projectId);
  const label = await resolveLabel(
    input.labelId,
    ctx.projectId,
    ctx.organizationId,
  );

  await dbPool
    .delete(taskLabels)
    .where(
      and(
        eq(taskLabels.taskId, task.id),
        eq(taskLabels.labelId, input.labelId),
      ),
    );

  return {
    taskId: task.id,
    taskNumber: task.number,
    taskTitle: task.content,
    labelId: label.id,
    labelName: label.name,
  };
}
