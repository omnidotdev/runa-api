import { EXPORTABLE } from "graphile-export";
import { context, sideEffect } from "postgraphile/grafast";
import { wrapPlans } from "postgraphile/utils";

import { AUTHZ_ENABLED, AUTHZ_PROVIDER_URL, checkPermission } from "lib/authz";
import { isWithinLimit } from "lib/entitlements";
import { FEATURE_KEYS, billingBypassSlugs } from "./constants";

import type { InsertProject } from "lib/db/schema";
import type { PlanWrapperFn } from "postgraphile/utils";
import type { MutationScope } from "./types";

/**
 * Validate project permissions via PDP.
 *
 * - Create: Admin permission on workspace required (with tier limits)
 * - Update: Admin permission on project required
 * - Delete: Admin permission on project required
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
      billingBypassSlugs,
      propName,
      scope,
    ): PlanWrapperFn =>
      (plan, _, fieldArgs) => {
        const $input = fieldArgs.getRaw(["input", propName]);
        const $observer = context().get("observer");
        const $db = context().get("db");
        const $withPgClient = context().get("withPgClient");
        const $authzCache = context().get("authzCache");

        sideEffect(
          [$input, $observer, $db, $withPgClient, $authzCache],
          async ([input, observer, db, withPgClient, authzCache]) => {
            if (!observer) throw new Error("Unauthorized");

            if (scope === "create") {
              const workspaceId = (input as InsertProject).workspaceId;

              const allowed = await checkPermission(
                AUTHZ_ENABLED,
                AUTHZ_PROVIDER_URL,
                observer.id,
                "workspace",
                workspaceId,
                "admin",
                authzCache,
              );
              if (!allowed) throw new Error("Unauthorized");

              // Get workspace for tier limit check
              const workspace = await db.query.workspaces.findFirst({
                where: (table, { eq }) => eq(table.id, workspaceId),
              });
              if (!workspace) throw new Error("Workspace not found");

              const totalProjects = await withPgClient(null, async (client) => {
                const result = await client.query({
                  text: "SELECT count(*)::int as total FROM project WHERE workspace_id = $1",
                  values: [workspaceId],
                });
                return (
                  (result.rows[0] as { total: number } | undefined)?.total ?? 0
                );
              });

              const withinLimit = await isWithinLimit(
                workspace,
                FEATURE_KEYS.MAX_PROJECTS,
                totalProjects,
                billingBypassSlugs,
              );
              if (!withinLimit)
                throw new Error("Maximum number of projects reached");
            } else {
              const allowed = await checkPermission(
                AUTHZ_ENABLED,
                AUTHZ_PROVIDER_URL,
                observer.id,
                "project",
                input as string,
                "admin",
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
      AUTHZ_ENABLED,
      AUTHZ_PROVIDER_URL,
      checkPermission,
      isWithinLimit,
      FEATURE_KEYS,
      billingBypassSlugs,
      propName,
      scope,
    ],
  );

/**
 * Authorization plugin for projects.
 *
 * Enforces admin+ requirement for project management.
 * Enforces tier-based project limits.
 */
const ProjectPlugin = wrapPlans({
  Mutation: {
    createProject: validatePermissions("project", "create"),
    updateProject: validatePermissions("rowId", "update"),
    deleteProject: validatePermissions("rowId", "delete"),
  },
});

export default ProjectPlugin;
