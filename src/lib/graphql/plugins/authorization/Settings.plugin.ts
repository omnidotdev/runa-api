import { EXPORTABLE } from "graphile-export/helpers";
import { context, sideEffect } from "postgraphile/grafast";
import { wrapPlans } from "postgraphile/utils";

import { AUTHZ_ENABLED, AUTHZ_PROVIDER_URL, checkPermission } from "lib/authz";

import type { PlanWrapperFn } from "postgraphile/utils";
import type { MutationScope } from "./types";

/**
 * Validate settings permissions via PDP.
 *
 * Settings are auto-provisioned on first access, so no create mutation.
 * - Update: Admin+ permission on organization required
 * - Delete: Owner permission on organization required (soft delete only)
 */
const validatePermissions = (propName: string, scope: MutationScope) =>
  EXPORTABLE(
    (
      context,
      sideEffect,
      AUTHZ_ENABLED,
      AUTHZ_PROVIDER_URL,
      checkPermission,
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

            // Get settings to find the organization
            const settings = await db.query.settings.findFirst({
              where: (table, { eq }) => eq(table.id, input as string),
              columns: { organizationId: true },
            });
            if (!settings) throw new Error("Settings not found");

            // Check permission on the organization
            const requiredPermission = scope === "delete" ? "owner" : "admin";
            const allowed = await checkPermission(
              AUTHZ_ENABLED,
              AUTHZ_PROVIDER_URL,
              observer.id,
              "organization",
              settings.organizationId,
              requiredPermission,
              authzCache,
            );
            if (!allowed) throw new Error("Unauthorized");
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
      propName,
      scope,
    ],
  );

/**
 * Authorization plugin for organization settings.
 *
 * Settings are auto-provisioned on first access (no create mutation).
 * - Update: Admin+ role required
 * - Delete: Owner only (soft delete)
 */
const SettingsPlugin = wrapPlans({
  Mutation: {
    updateSettings: validatePermissions("rowId", "update"),
    deleteSettings: validatePermissions("rowId", "delete"),
  },
});

export default SettingsPlugin;
