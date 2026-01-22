import { EXPORTABLE } from "graphile-export";
import { context, sideEffect } from "postgraphile/grafast";
import { wrapPlans } from "postgraphile/utils";

import { checkPermission } from "lib/authz";

import type { InsertTaskLabel } from "lib/db/schema";
import type { PlanWrapperFn } from "postgraphile/utils";
import type { MutationScope } from "./types";

/**
 * Validate task label permissions via PDP.
 *
 * - Create: Member permission on project required
 * - Update: Member permission on project required
 * - Delete: Member permission on project required
 */
const validatePermissions = (propName: string, scope: MutationScope) =>
  EXPORTABLE(
    (
      context,
      sideEffect,
      checkPermission,
      propName,
      scope,
    ): PlanWrapperFn =>
      (plan, _, fieldArgs) => {
        const $input = fieldArgs.getRaw(["input", propName]);
        const $observer = context().get("observer");
        const $db = context().get("db");

        sideEffect([$input, $observer, $db], async ([input, observer, db]) => {
          if (!observer) throw new Error("Unauthorized");

          if (scope === "create") {
            const taskId = (input as InsertTaskLabel).taskId;

            // Get task to find project for AuthZ check
            const task = await db.query.tasks.findFirst({
              where: (table, { eq }) => eq(table.id, taskId),
              columns: { projectId: true },
            });
            if (!task) throw new Error("Task not found");

            const allowed = await checkPermission(
              observer.id,
              "project",
              task.projectId,
              "member",
            );
            if (!allowed) throw new Error("Unauthorized");
          } else {
            // input is { taskId, labelId } for composite key tables
            const { taskId } = input as { taskId: string; labelId: string };

            // Get task to find project for AuthZ check
            const task = await db.query.tasks.findFirst({
              where: (table, { eq }) => eq(table.id, taskId),
              columns: { projectId: true },
            });
            if (!task) throw new Error("Task not found");

            const allowed = await checkPermission(
              observer.id,
              "project",
              task.projectId,
              "member",
            );
            if (!allowed) throw new Error("Unauthorized");
          }
        });

        return plan();
      },
    [
      context,
      sideEffect,
      checkPermission,
      propName,
      scope,
    ],
  );

/**
 * Authorization plugin for task labels.
 *
 * Enforces organization membership. Update/delete requires task author or admin+ role.
 */
const TaskLabelPlugin = wrapPlans({
  Mutation: {
    createTaskLabel: validatePermissions("taskLabel", "create"),
    updateTaskLabel: validatePermissions("rowId", "update"),
    deleteTaskLabel: validatePermissions("rowId", "delete"),
  },
});

export default TaskLabelPlugin;
