import { EXPORTABLE } from "graphile-export";
import { context, sideEffect } from "postgraphile/grafast";
import { wrapPlans } from "postgraphile/utils";

import { checkPermission } from "lib/authz";

import type { InsertInvitation } from "lib/db/schema";
import type { PlanWrapperFn } from "postgraphile/utils";
import type { MutationScope } from "./types";

/**
 * Validate invitation permissions.
 *
 * - Create: Admin+ on target organization
 * - Delete (revoke): Admin+ on target organization
 */
const validatePermissions = (propName: string, scope: MutationScope) =>
  EXPORTABLE(
    (
      context,
      sideEffect,
      checkPermission,
      propName,
      scope,
    ): PlanWrapperFn =>
      (plan, _, fieldArgs) => {
        const $input = fieldArgs.getRaw(["input", propName]);
        const $observer = context().get("observer");
        const $withPgClient = context().get("withPgClient");
        const $authzCache = context().get("authzCache");
        const $accessToken = context().get("accessToken");

        sideEffect(
          [$input, $observer, $withPgClient, $authzCache, $accessToken],
          async ([input, observer, withPgClient, authzCache, accessToken]) => {
            if (!observer) throw new Error("Unauthorized");
            if (!accessToken) throw new Error("Unauthorized");

            if (scope === "create") {
              const invitationInput = input as InsertInvitation;
              const organizationId = invitationInput.organizationId;

              // Check admin permission via PDP
              const pdpAllowed = await checkPermission(
                observer.id,
                "organization",
                organizationId,
                "admin",
                accessToken,
                authzCache,
              );

              if (!pdpAllowed) {
                // DB fallback: verify caller is admin+ in the target org
                const callerRole = await withPgClient(
                  null,
                  async (client) => {
                    const result = await client.query<{ role: string }>({
                      text: "SELECT role FROM user_organization WHERE user_id = $1 AND organization_id = $2",
                      values: [observer.id, organizationId],
                    });
                    return result.rows[0]?.role ?? null;
                  },
                );

                if (
                  !callerRole ||
                  (callerRole !== "owner" && callerRole !== "admin")
                ) {
                  throw new Error("Unauthorized");
                }
              }
            } else {
              // Delete (revoke): look up the invitation to get organizationId
              const targetRowId = input as string;

              const invitation = await withPgClient(
                null,
                async (client) => {
                  const result = await client.query<{
                    organization_id: string;
                  }>({
                    text: "SELECT organization_id FROM invitation WHERE id = $1",
                    values: [targetRowId],
                  });
                  return result.rows[0] ?? null;
                },
              );
              if (!invitation) throw new Error("Invitation not found");

              const pdpAllowed = await checkPermission(
                observer.id,
                "organization",
                invitation.organization_id,
                "admin",
                accessToken,
                authzCache,
              );

              if (!pdpAllowed) {
                const callerRole = await withPgClient(
                  null,
                  async (client) => {
                    const result = await client.query<{ role: string }>({
                      text: "SELECT role FROM user_organization WHERE user_id = $1 AND organization_id = $2",
                      values: [observer.id, invitation.organization_id],
                    });
                    return result.rows[0]?.role ?? null;
                  },
                );

                if (
                  !callerRole ||
                  (callerRole !== "owner" && callerRole !== "admin")
                ) {
                  throw new Error("Unauthorized");
                }
              }
            }
          },
        );

        return plan();
      },
    [
      context,
      sideEffect,
      checkPermission,
      propName,
      scope,
    ],
  );

/**
 * Authorization plugin for invitations.
 *
 * Enforces admin+ requirement for invitation management.
 */
const InvitationPlugin = wrapPlans({
  Mutation: {
    createInvitation: validatePermissions("invitation", "create"),
    deleteInvitation: validatePermissions("rowId", "delete"),
  },
});

export default InvitationPlugin;
