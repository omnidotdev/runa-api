import { EXPORTABLE } from "graphile-export";
import { context, sideEffect } from "postgraphile/grafast";
import { wrapPlans } from "postgraphile/utils";

import { checkPermission } from "lib/authz";
import { isWithinLimit } from "lib/entitlements";
import { FEATURE_KEYS, billingBypassOrgIds } from "./constants";

import type { InsertTask } from "lib/db/schema";
import type { PlanWrapperFn } from "postgraphile/utils";
import type { MutationScope } from "./types";

/**
 * Validate task permissions via PDP.
 *
 * - Create: Editor permission on project required (with tier limits)
 * - Update: Editor permission on project required
 * - Delete: Editor permission on project required
 *
 * Note: Member tuples are synced to PDP by IDP (Gatekeeper), so we rely
 * entirely on PDP checks. No local member table fallback.
 */
const validatePermissions = (propName: string, scope: MutationScope) =>
  EXPORTABLE(
    (
      context,
      sideEffect,
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
        const $withPgClient = context().get("withPgClient");
        const $authzCache = context().get("authzCache");
        const $accessToken = context().get("accessToken");

        sideEffect(
          [$input, $observer, $db, $withPgClient, $authzCache, $accessToken],
          async ([
            input,
            observer,
            db,
            withPgClient,
            authzCache,
            accessToken,
          ]) => {
            if (!observer) throw new Error("Unauthorized");
            if (!accessToken) throw new Error("Unauthorized");

            if (scope === "create") {
              const projectId = (input as InsertTask).projectId;

              const allowed = await checkPermission(
                observer.identityProviderId,
                "project",
                projectId,
                "editor",
                accessToken,
                authzCache,
              );
              if (!allowed) throw new Error("Unauthorized");

              // Get project for tier limit check
              const project = await db.query.projects.findFirst({
                where: (table, { eq }) => eq(table.id, projectId),
              });
              if (!project) throw new Error("Project not found");

              const totalTasks = await withPgClient(null, async (client) => {
                const result = await client.query({
                  text: `SELECT count(*)::int as total FROM task
                         INNER JOIN project ON task.project_id = project.id
                         WHERE project.organization_id = $1`,
                  values: [project.organizationId],
                });
                return (
                  (result.rows[0] as { total: number } | undefined)?.total ?? 0
                );
              });

              const withinLimit = await isWithinLimit(
                { organizationId: project.organizationId },
                FEATURE_KEYS.MAX_TASKS,
                totalTasks,
                billingBypassOrgIds,
              );
              if (!withinLimit)
                throw new Error("Maximum number of tasks reached");
            } else {
              // Get task to find associated project for permission check
              const task = await db.query.tasks.findFirst({
                where: (table, { eq }) => eq(table.id, input),
                columns: { projectId: true },
              });
              if (!task) throw new Error("Task not found");

              const allowed = await checkPermission(
                observer.identityProviderId,
                "project",
                task.projectId,
                "editor",
                accessToken,
                authzCache,
              );
              if (!allowed) throw new Error("Unauthorized");
            }
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
      propName,
      scope,
    ],
  );

/**
 * Authorization plugin for tasks.
 *
 * Any member can create tasks. Update/delete requires author or admin+ role.
 * Enforces tier-based task limits.
 */
const TaskPlugin = wrapPlans({
  Mutation: {
    createTask: validatePermissions("task", "create"),
    updateTask: validatePermissions("rowId", "update"),
    deleteTask: validatePermissions("rowId", "delete"),
  },
});

export default TaskPlugin;
