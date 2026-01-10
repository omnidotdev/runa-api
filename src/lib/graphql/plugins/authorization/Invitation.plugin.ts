import { EXPORTABLE } from "graphile-export";
import { context, sideEffect } from "postgraphile/grafast";
import { wrapPlans } from "postgraphile/utils";

import { AUTHZ_ENABLED, AUTHZ_PROVIDER_URL, checkPermission } from "lib/authz";

import type { InsertInvitation } from "lib/db/schema";
import type { PlanWrapperFn } from "postgraphile/utils";
import type { MutationScope } from "./types";

/**
 * Validate invitation permissions via Warden.
 *
 * - Create: Admin permission on workspace required
 * - Update: Admin permission on workspace required
 * - Delete: Admin permission on workspace required, OR invitee can delete own invitation
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

            if (scope === "create") {
              const workspaceId = (input as InsertInvitation).workspaceId;

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
            } else {
              // Get invitation to check ownership and workspace
              const invitation = await db.query.invitationsTable.findFirst({
                where: (table, { eq }) => eq(table.id, input),
                columns: { email: true, workspaceId: true },
              });
              if (!invitation) throw new Error("Invitation not found");

              // Special case: Allow user to delete their own invitation
              const isOwnInvitation = invitation.email === observer.email;
              if (scope === "delete" && isOwnInvitation) {
                return;
              }

              const allowed = await checkPermission(
                AUTHZ_ENABLED,
                AUTHZ_PROVIDER_URL,
                observer.id,
                "workspace",
                invitation.workspaceId,
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
    updateInvitation: validatePermissions("rowId", "update"),
    deleteInvitation: validatePermissions("rowId", "delete"),
  },
});

export default InvitationPlugin;
