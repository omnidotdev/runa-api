import { EXPORTABLE } from "graphile-export/helpers";
import { context, sideEffect } from "postgraphile/grafast";
import { wrapPlans } from "postgraphile/utils";

import { getDefaultOrganization } from "lib/auth/organizations";
import { AUTHZ_ENABLED, AUTHZ_PROVIDER_URL, checkPermission } from "lib/authz";

import type { OrganizationClaim } from "lib/auth/organizations";
import type { PlanWrapperFn } from "postgraphile/utils";
import type { MutationScope } from "./types";

/**
 * Validate that user belongs to the specified organization.
 */
const validateOrgMembership = (
  organizations: OrganizationClaim[],
  organizationId: string,
): boolean => {
  return organizations.some((org) => org.id === organizationId);
};

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
      validateOrgMembership,
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
              // For create, validate org membership
              const workspaceInput = input as {
                organizationId?: string;
                name: string;
                slug: string;
              };

              // If organizationId provided, validate membership
              // If not provided, use default org (will be set by mutation)
              const targetOrgId =
                workspaceInput.organizationId ??
                getDefaultOrganization(organizations)?.id;

              if (!targetOrgId) {
                throw new Error("No organization available");
              }

              if (!validateOrgMembership(organizations, targetOrgId)) {
                throw new Error(
                  "Unauthorized: You are not a member of this organization",
                );
              }
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
      validateOrgMembership,
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
