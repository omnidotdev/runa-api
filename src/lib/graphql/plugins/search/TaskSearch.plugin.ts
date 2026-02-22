import { EXPORTABLE } from "graphile-export";
import { context, sideEffect } from "postgraphile/grafast";
import { wrapPlans } from "postgraphile/utils";

import { deleteTaskFromIndex, indexTask, isSearchEnabled } from "lib/search";

import type { Step } from "postgraphile/grafast";
import type { PlanWrapperFn } from "postgraphile/utils";

/**
 * Index task after successful creation.
 */
const indexOnCreate = (): PlanWrapperFn =>
  EXPORTABLE(
    (context, sideEffect, indexTask, isSearchEnabled): PlanWrapperFn =>
      (plan, $record) => {
        if (!isSearchEnabled) return plan();

        const $db = context().get("db");

        sideEffect([$record, $db], async ([record, db]) => {
          if (!record?.id) return;

          const task = await db.query.tasks.findFirst({
            // biome-ignore lint/suspicious/noExplicitAny: drizzle callback types
            where: (table: any, { eq }: any) => eq(table.id, record.id),
            with: { project: true },
          });

          if (task?.project) {
            await indexTask(task, task.project.organizationId);
          }
        });

        return plan();
      },
    [context, sideEffect, indexTask, isSearchEnabled],
  );

/**
 * Re-index task after update.
 */
const indexOnUpdate = (): PlanWrapperFn =>
  EXPORTABLE(
    (context, sideEffect, indexTask, isSearchEnabled): PlanWrapperFn =>
      (plan, $record) => {
        if (!isSearchEnabled) return plan();

        const $db = context().get("db");

        sideEffect([$record, $db], async ([record, db]) => {
          if (!record?.id) return;

          const task = await db.query.tasks.findFirst({
            // biome-ignore lint/suspicious/noExplicitAny: drizzle callback types
            where: (table: any, { eq }: any) => eq(table.id, record.id),
            with: { project: true },
          });

          if (task?.project) {
            await indexTask(task, task.project.organizationId);
          }
        });

        return plan();
      },
    [context, sideEffect, indexTask, isSearchEnabled],
  );

/**
 * Remove task from index on delete.
 */
const removeOnDelete = (): PlanWrapperFn =>
  EXPORTABLE(
    (
      _context,
      sideEffect,
      deleteTaskFromIndex,
      isSearchEnabled,
    ): PlanWrapperFn =>
      (plan, _, fieldArgs) => {
        if (!isSearchEnabled) return plan();

        const $input = fieldArgs.getRaw([
          "input",
          "rowId",
        ]) as unknown as Step<string>;

        sideEffect([$input], async ([taskId]) => {
          if (taskId) {
            await deleteTaskFromIndex(taskId);
          }
        });

        return plan();
      },
    [context, sideEffect, deleteTaskFromIndex, isSearchEnabled],
  );

/**
 * Search indexing plugin for tasks.
 * Indexes tasks in Meilisearch after create/update mutations.
 * Removes tasks from index on delete.
 */
const TaskSearchPlugin = wrapPlans({
  Mutation: {
    createTask: indexOnCreate(),
    updateTask: indexOnUpdate(),
    deleteTask: removeOnDelete(),
  },
});

export default TaskSearchPlugin;
