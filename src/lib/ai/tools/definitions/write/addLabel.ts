/**
 * addLabel tool definition.
 *
 * Add a label to a task by ID or name.
 */

import { and, eq } from "drizzle-orm";

import { dbPool } from "lib/db/db";
import { labels, taskLabels } from "lib/db/schema";
import { resolveLabel, resolveTask } from "../../core/helpers";

import type { WriteToolContext } from "../../core/context";
import type { AddLabelInput } from "../../core/schemas";

export const ADD_LABEL_DESCRIPTION = "Add a label to a task by ID or name.";

export interface AddLabelResult {
  taskId: string;
  taskNumber: number | null;
  taskTitle: string;
  labelId: string;
  labelName: string;
  labelCreated: boolean;
}

export async function executeAddLabel(
  input: AddLabelInput,
  ctx: WriteToolContext,
): Promise<AddLabelResult> {
  if (!input.labelId && !input.labelName) {
    throw new Error("Either labelId or labelName must be provided.");
  }

  const task = await resolveTask(input, ctx.projectId);
  let label: { id: string; name: string };
  let labelCreated = false;

  if (input.labelId) {
    label = await resolveLabel(
      input.labelId,
      ctx.projectId,
      ctx.organizationId,
    );
  } else {
    const labelName = input.labelName!.trim();

    let existingLabel = await dbPool.query.labels.findFirst({
      where: and(
        eq(labels.projectId, ctx.projectId),
        eq(labels.name, labelName),
      ),
      columns: { id: true, name: true },
    });

    if (!existingLabel) {
      existingLabel = await dbPool.query.labels.findFirst({
        where: and(
          eq(labels.organizationId, ctx.organizationId),
          eq(labels.name, labelName),
        ),
        columns: { id: true, name: true },
      });
    }

    if (existingLabel) {
      label = existingLabel;
    } else if (input.createIfMissing) {
      const [newLabel] = await dbPool
        .insert(labels)
        .values({
          name: labelName,
          color: input.labelColor ?? "blue",
          projectId: ctx.projectId,
        })
        .returning({ id: labels.id, name: labels.name });
      label = newLabel;
      labelCreated = true;
    } else {
      throw new Error(`Label "${labelName}" not found.`);
    }
  }

  await dbPool
    .insert(taskLabels)
    .values({ taskId: task.id, labelId: label.id })
    .onConflictDoNothing();

  return {
    taskId: task.id,
    taskNumber: task.number,
    taskTitle: task.content,
    labelId: label.id,
    labelName: label.name,
    labelCreated,
  };
}
