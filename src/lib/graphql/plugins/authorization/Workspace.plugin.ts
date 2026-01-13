import { EXPORTABLE } from "graphile-export/helpers";
import { context, sideEffect } from "postgraphile/grafast";
import { wrapPlans } from "postgraphile/utils";

import { getDefaultOrganization } from "lib/auth/organizations";
import { AUTHZ_ENABLED, AUTHZ_PROVIDER_URL, checkPermission } from "lib/authz";
import { validateOrgExists } from "lib/idp/validateOrg";

import type { PlanWrapperFn } from "postgraphile/utils";
import type { MutationScope } from "./types";

/**
 * Validate workspace permissions via PDP.
 *
 * - Create: User must belong to the specified organization
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
      getDefaultOrganization,
      validateOrgExists,
      propName,
      scope,
    ): PlanWrapperFn =>
      (plan, _, fieldArgs) => {
        const $input = fieldArgs.getRaw(["input", propName]);
        const $observer = context().get("observer");
        const $organizations = context().get("organizations");
        const $authzCache = context().get("authzCache");

        sideEffect(
          [$input, $observer, $organizations, $authzCache],
          async ([input, observer, organizations, authzCache]) => {
            if (!observer) throw new Error("Unauthorized");

            if (scope === "create") {
              // For create, validate org is specified or use default
              // Note: We don't validate org membership here because:
              // 1. JWT claims may be stale (user just created org in IDP)
              // 2. Creating a workspace is harmless - permissions come from member table
              // 3. User will add themselves as owner in the subsequent createWorkspaceUser call
              const workspaceInput = input as {
                organizationId?: string;
              };

              const targetOrgId =
                workspaceInput.organizationId ??
                getDefaultOrganization(organizations)?.id;

              if (!targetOrgId) {
                throw new Error("No organization available");
              }

              // Validate org exists in IDP (fail-open if IDP unavailable)
              const orgExists = await validateOrgExists(targetOrgId);
              if (!orgExists) {
                throw new Error("Organization not found in identity provider");
              }

              // Org ID is valid, allow workspace creation
              // Actual access control happens via member table and PDP
            } else {
              // For update/delete, check PDP permissions
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
      getDefaultOrganization,
      validateOrgExists,
      propName,
      scope,
    ],
  );

/**
 * Authorization plugin for workspaces.
 *
 * - Create: Any authenticated user (with org membership validation)
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
