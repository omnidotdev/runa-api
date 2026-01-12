import { EXPORTABLE } from "graphile-export";
import { context, sideEffect } from "postgraphile/grafast";
import { wrapPlans } from "postgraphile/utils";

import { AUTHZ_ENABLED, AUTHZ_PROVIDER_URL, checkPermission } from "lib/authz";
import { isWithinLimit } from "lib/entitlements";
import { FEATURE_KEYS, billingBypassOrgIds } from "./constants";

import type { InsertAssignee } from "lib/db/schema";
import type { PlanWrapperFn } from "postgraphile/utils";
import type { MutationScope } from "./types";

/**
 * Validate assignee permissions via PDP.
 *
 * - Create: Member permission on project required (with tier limits)
 * - Update: Member permission on project required
 * - Delete: Member permission on project required
 */
const validatePermissions = (propName: string, scope: MutationScope) =>
  EXPORTABLE(
    (
      context,
      sideEffect,
      AUTHZ_ENABLED,
      AUTHZ_PROVIDER_URL,
      checkPermission,
      isWithinLimit,
      FEATURE_KEYS,
      billingBypassOrgIds,
      propName,
      scope,
    ): PlanWrapperFn =>
      (plan, _, fieldArgs) => {
        const $input = fieldArgs.getRaw(["input", propName]);
        const $observer = context().get("observer");
        const $db = context().get("db");

        const $authzCache = context().get("authzCache");

        sideEffect(
          [$input, $observer, $db, $authzCache],
          async ([input, observer, db, authzCache]) => {
            if (!observer) throw new Error("Unauthorized");

            if (scope !== "create") {
              // input is { taskId, userId } for composite key tables
              const { taskId } = input as { taskId: string; userId: string };

              // Get task to find project for AuthZ check
              const task = await db.query.tasks.findFirst({
                where: (table, { eq }) => eq(table.id, taskId),
                columns: { projectId: true },
              });
              if (!task) throw new Error("Task not found");

              const allowed = await checkPermission(
                AUTHZ_ENABLED,
                AUTHZ_PROVIDER_URL,
                observer.id,
                "project",
                task.projectId,
                "member",
                authzCache,
              );
              if (!allowed) throw new Error("Unauthorized");
            } else {
              const taskId = (input as InsertAssignee).taskId;

              // Get task with assignees and workspace for tier limit check
              const task = await db.query.tasks.findFirst({
                where: (table, { eq }) => eq(table.id, taskId),
                with: {
                  assignees: true,
                  project: { with: { workspace: true } },
                },
              });
              if (!task) throw new Error("Task not found");

              const allowed = await checkPermission(
                AUTHZ_ENABLED,
                AUTHZ_PROVIDER_URL,
                observer.id,
                "project",
                task.project.id,
                "member",
                authzCache,
              );
              if (!allowed) throw new Error("Unauthorized");

              const withinLimit = await isWithinLimit(
                task.project.workspace,
                FEATURE_KEYS.MAX_ASSIGNEES,
                task.assignees.length,
                billingBypassOrgIds,
              );
              if (!withinLimit)
                throw new Error("Maximum number of assignees reached");
            }
          },
        );

        return plan();
      },
    [
      context,
      sideEffect,
      AUTHZ_ENABLED,
      AUTHZ_PROVIDER_URL,
      checkPermission,
      isWithinLimit,
      FEATURE_KEYS,
      billingBypassOrgIds,
      propName,
      scope,
    ],
  );

/**
 * Authorization plugin for assignees.
 */
const AssigneePlugin = wrapPlans({
  Mutation: {
    createAssignee: validatePermissions("assignee", "create"),
    updateAssignee: validatePermissions("rowId", "update"),
    deleteAssignee: validatePermissions("rowId", "delete"),
  },
});

export default AssigneePlugin;
