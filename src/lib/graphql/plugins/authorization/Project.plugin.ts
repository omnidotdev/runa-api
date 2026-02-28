import { EXPORTABLE } from "graphile-export";
import { context, sideEffect } from "postgraphile/grafast";
import { wrapPlans } from "postgraphile/utils";

import { checkPermission } from "lib/authz";
import { isWithinLimit } from "lib/entitlements";
import { FEATURE_KEYS, billingBypassOrgIds } from "./constants";

import type { InsertProject } from "lib/db/schema";
import type { PlanWrapperFn } from "postgraphile/utils";
import type { MutationScope } from "./types";

/**
 * Validate project permissions via PDP.
 *
 * - Create: Admin permission on organization required (with tier limits)
 * - Update: Admin permission on project required
 * - Delete: Admin permission on project required
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
              const organizationId = (input as InsertProject).organizationId;

              // Check admin permission on organization
              const allowed = await checkPermission(
                observer.identityProviderId,
                "organization",
                organizationId,
                "admin",
                accessToken,
                authzCache,
              );
              if (!allowed) throw new Error("Unauthorized");

              // Get settings for tier limit check (may not exist yet)
              const settings = await db.query.settings.findFirst({
                where: (table, { eq }) =>
                  eq(table.organizationId, organizationId),
              });

              const totalProjects = await withPgClient(null, async (client) => {
                const result = await client.query({
                  text: "SELECT count(*)::int as total FROM project WHERE organization_id = $1",
                  values: [organizationId],
                });
                return (
                  (result.rows[0] as { total: number } | undefined)?.total ?? 0
                );
              });

              // Use settings for tier check, or allow if no settings yet (free tier)
              const withinLimit = await isWithinLimit(
                settings ?? { organizationId },
                FEATURE_KEYS.MAX_PROJECTS,
                totalProjects,
                billingBypassOrgIds,
              );
              if (!withinLimit)
                throw new Error("Maximum number of projects reached");
            } else {
              // For update/delete, check permission on the project
              const projectId = input as string;

              const allowed = await checkPermission(
                observer.identityProviderId,
                "project",
                projectId,
                "admin",
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
