import { EXPORTABLE } from "graphile-export";
import { context, sideEffect } from "postgraphile/grafast";
import { wrapPlans } from "postgraphile/utils";

import { checkPermission } from "lib/authz";

import type { InsertTaskLabel } from "lib/db/schema";
import type { PlanWrapperFn } from "postgraphile/utils";

/**
 * Validate create task label permissions via PDP.
 * Member permission on project required.
 */
const validateCreatePermissions = (): PlanWrapperFn =>
  EXPORTABLE(
    (context, sideEffect, checkPermission): PlanWrapperFn =>
      (plan, _, fieldArgs) => {
        const $input = fieldArgs.getRaw(["input", "taskLabel"]);
        const $observer = context().get("observer");
        const $db = context().get("db");
        const $authzCache = context().get("authzCache");
        const $accessToken = context().get("accessToken");

        sideEffect(
          [$input, $observer, $db, $authzCache, $accessToken],
          async ([input, observer, db, authzCache, accessToken]) => {
            if (!observer) throw new Error("Unauthorized");
            if (!accessToken) throw new Error("Unauthorized");

            const taskId = (input as InsertTaskLabel).taskId;

            // Get task to find project for AuthZ check
            const task = await db.query.tasks.findFirst({
              where: (table, { eq }) => eq(table.id, taskId),
              columns: { projectId: true },
            });
            if (!task) throw new Error("Task not found");

            const allowed = await checkPermission(
              observer.identityProviderId,
              "project",
              task.projectId,
              "member",
              accessToken,
              authzCache,
            );
            if (!allowed) throw new Error("Unauthorized");
          },
        );

        return plan();
      },
    [context, sideEffect, checkPermission],
  );

/**
 * Validate delete task label permissions via PDP.
 * Member permission on project required.
 *
 * Note: TaskLabel uses composite key (taskId, labelId), so the input
 * has these fields at the root level, not nested under "rowId".
 */
const validateDeletePermissions = (): PlanWrapperFn =>
  EXPORTABLE(
    (context, sideEffect, checkPermission): PlanWrapperFn =>
      (plan, _, fieldArgs) => {
        // For composite key tables, taskId and labelId are at root level of input
        const $taskId = fieldArgs.getRaw(["input", "taskId"]);
        const $observer = context().get("observer");
        const $db = context().get("db");
        const $authzCache = context().get("authzCache");
        const $accessToken = context().get("accessToken");

        sideEffect(
          [$taskId, $observer, $db, $authzCache, $accessToken],
          async ([taskId, observer, db, authzCache, accessToken]) => {
            if (!observer) throw new Error("Unauthorized");
            if (!accessToken) throw new Error("Unauthorized");

            // Get task to find project for AuthZ check
            const task = await db.query.tasks.findFirst({
              where: (table, { eq }) => eq(table.id, taskId as string),
              columns: { projectId: true },
            });
            if (!task) throw new Error("Task not found");

            const allowed = await checkPermission(
              observer.identityProviderId,
              "project",
              task.projectId,
              "member",
              accessToken,
              authzCache,
            );
            if (!allowed) throw new Error("Unauthorized");
          },
        );

        return plan();
      },
    [context, sideEffect, checkPermission],
  );

/**
 * Authorization plugin for task labels.
 * Enforces project member permission for create/delete operations.
 */
const TaskLabelPlugin = wrapPlans({
  Mutation: {
    createTaskLabel: validateCreatePermissions(),
    deleteTaskLabel: validateDeletePermissions(),
  },
});

export default TaskLabelPlugin;
