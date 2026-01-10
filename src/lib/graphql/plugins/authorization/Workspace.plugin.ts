import { EXPORTABLE } from "graphile-export";
import { context, sideEffect } from "postgraphile/grafast";
import { wrapPlans } from "postgraphile/utils";

import { AUTHZ_ENABLED, AUTHZ_PROVIDER_URL, checkPermission } from "lib/authz";

import type { PlanWrapperFn } from "postgraphile/utils";
import type { MutationScope } from "./types";

/**
 * Validate workspace permissions via Warden.
 *
 * - Create: Any authenticated user can create a workspace
 * - Update: Admin+ permission required
 * - Delete: Owner permission required
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
        const $authzCache = context().get("authzCache");

        sideEffect(
          [$input, $observer, $authzCache],
          async ([input, observer, authzCache]) => {
            if (!observer) throw new Error("Unauthorized");

            if (scope !== "create") {
              const requiredPermission = scope === "delete" ? "owner" : "admin";
              const allowed = await checkPermission(
                AUTHZ_ENABLED,
                AUTHZ_PROVIDER_URL,
                observer.id,
                "workspace",
                input as string,
                requiredPermission,
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
      propName,
      scope,
    ],
  );

/**
 * Authorization plugin for workspaces.
 *
 * - Create: Any authenticated user
 * - Update: Admin+ role required
 * - Delete: Owner only
 */
const WorkspacePlugin = wrapPlans({
  Mutation: {
    createWorkspace: validatePermissions("workspace", "create"),
    updateWorkspace: validatePermissions("rowId", "update"),
    deleteWorkspace: validatePermissions("rowId", "delete"),
  },
});

export default WorkspacePlugin;
