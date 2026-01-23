import { EXPORTABLE } from "graphile-export";
import { context, sideEffect } from "postgraphile/grafast";
import { wrapPlans } from "postgraphile/utils";

import { checkPermission } from "lib/authz";
import { isWithinLimit } from "lib/entitlements";
import { FEATURE_KEYS, billingBypassOrgIds } from "./constants";

import type { InsertColumn } from "lib/db/schema";
import type { PlanWrapperFn } from "postgraphile/utils";
import type { MutationScope } from "./types";

/**
 * Validate column permissions via PDP.
 *
 * - Create: Admin permission on project required (with tier limits)
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
        const $authzCache = context().get("authzCache");
        const $accessToken = context().get("accessToken");

        sideEffect(
          [$input, $observer, $db, $authzCache, $accessToken],
          async ([input, observer, db, authzCache, accessToken]) => {
            if (!observer) throw new Error("Unauthorized");
            if (!accessToken) throw new Error("Unauthorized");

            if (scope !== "create") {
              // Get column to find project for AuthZ check
              const column = await db.query.columns.findFirst({
                where: (table, { eq }) => eq(table.id, input),
                columns: { projectId: true },
              });
              if (!column) throw new Error("Column not found");

              const allowed = await checkPermission(
                observer.id,
                "project",
                column.projectId,
                "admin",
                accessToken,
                authzCache,
              );
              if (!allowed) throw new Error("Unauthorized");
            } else {
              const projectId = (input as InsertColumn).projectId;

              const allowed = await checkPermission(
                observer.id,
                "project",
                projectId,
                "admin",
                accessToken,
                authzCache,
              );
              if (!allowed) throw new Error("Unauthorized");

              // Get project with columns for tier limit check
              const project = await db.query.projects.findFirst({
                where: (table, { eq }) => eq(table.id, projectId),
                with: { columns: true },
              });
              if (!project) throw new Error("Project not found");

              const withinLimit = await isWithinLimit(
                { organizationId: project.organizationId },
                FEATURE_KEYS.MAX_COLUMNS,
                project.columns.length,
                billingBypassOrgIds,
              );
              if (!withinLimit)
                throw new Error("Maximum number of columns reached");
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
 * Authorization plugin for columns.
 */
const ColumnPlugin = wrapPlans({
  Mutation: {
    createColumn: validatePermissions("column", "create"),
    updateColumn: validatePermissions("rowId", "update"),
    deleteColumn: validatePermissions("rowId", "delete"),
  },
});

export default ColumnPlugin;
