import { EXPORTABLE } from "graphile-export";
import { context, sideEffect } from "postgraphile/grafast";
import { wrapPlans } from "postgraphile/utils";

import { checkPermission } from "lib/authz";
import { isWithinLimit } from "lib/entitlements";
import { FEATURE_KEYS, billingBypassOrgIds } from "./constants";

import type { InsertAssignee } from "lib/db/schema";
import type { PlanWrapperFn } from "postgraphile/utils";

/**
 * Validate create assignee permissions via PDP.
 * Member permission on project required, with tier limits check.
 */
const validateCreatePermissions = (): PlanWrapperFn =>
  EXPORTABLE(
    (
      context,
      sideEffect,
      checkPermission,
      isWithinLimit,
      FEATURE_KEYS,
      billingBypassOrgIds,
    ): PlanWrapperFn =>
      (plan, _, fieldArgs) => {
        const $input = fieldArgs.getRaw(["input", "assignee"]);
        const $observer = context().get("observer");
        const $db = context().get("db");
        const $authzCache = context().get("authzCache");
        const $accessToken = context().get("accessToken");

        sideEffect(
          [$input, $observer, $db, $authzCache, $accessToken],
          async ([input, observer, db, authzCache, accessToken]) => {
            if (!observer) throw new Error("Unauthorized");
            if (!accessToken) throw new Error("Unauthorized");

            const taskId = (input as InsertAssignee).taskId;

            // Get task with assignees and project for tier limit check
            const task = await db.query.tasks.findFirst({
              where: (table, { eq }) => eq(table.id, taskId),
              with: {
                assignees: true,
                project: true,
              },
            });
            if (!task) throw new Error("Task not found");

            const allowed = await checkPermission(
              observer.identityProviderId,
              "project",
              task.project.id,
              "member",
              accessToken,
              authzCache,
            );
            if (!allowed) throw new Error("Unauthorized");

            const withinLimit = await isWithinLimit(
              { organizationId: task.project.organizationId },
              FEATURE_KEYS.MAX_ASSIGNEES,
              task.assignees.length,
              billingBypassOrgIds,
            );
            if (!withinLimit)
              throw new Error("Maximum number of assignees reached");
          },
        );

        return plan();
      },
    [
      context,
      sideEffect,
      checkPermission,
      isWithinLimit,
      FEATURE_KEYS,
      billingBypassOrgIds,
    ],
  );

/**
 * Validate delete assignee permissions via PDP.
 * Member permission on project required.
 *
 * Note: Assignee uses composite key (taskId, userId), so the input
 * has these fields at the root level, not nested under "rowId".
 */
const validateDeletePermissions = (): PlanWrapperFn =>
  EXPORTABLE(
    (context, sideEffect, checkPermission): PlanWrapperFn =>
      (plan, _, fieldArgs) => {
        // For composite key tables, taskId and userId are at root level of input
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
 * Authorization plugin for assignees.
 */
const AssigneePlugin = wrapPlans({
  Mutation: {
    createAssignee: validateCreatePermissions(),
    deleteAssignee: validateDeletePermissions(),
  },
});

export default AssigneePlugin;
