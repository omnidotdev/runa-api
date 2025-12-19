import { EXPORTABLE } from "graphile-export";
import { context, sideEffect } from "postgraphile/grafast";
import { wrapPlans } from "postgraphile/utils";

import type { InsertInvitation } from "lib/db/schema";
import type { PlanWrapperFn } from "postgraphile/utils";
import type { MutationScope } from "./types";

/**
 * Validates invitation permissions.
 *
 * Invitations require admin+ role, with exceptions:
 * - Create: Admin+ can invite new members
 * - Update: Admin+ can modify invitations
 * - Delete: Admin+ can revoke invitations, OR the invitee can delete their own invitation
 */
const validatePermissions = (propName: string, scope: MutationScope) =>
  EXPORTABLE(
    (context, sideEffect, propName, scope): PlanWrapperFn =>
      (plan, _, fieldArgs) => {
        const $input = fieldArgs.getRaw(["input", propName]);
        const $observer = context().get("observer");
        const $db = context().get("db");

        sideEffect([$input, $observer, $db], async ([input, observer, db]) => {
          if (!observer) throw new Error("Unauthorized");

          if (scope === "create") {
            const workspaceId = (input as InsertInvitation).workspaceId;

            const workspace = await db.query.workspaceTable.findFirst({
              where: (table, { eq }) => eq(table.id, workspaceId),
              with: {
                workspaceUsers: {
                  where: (table, { eq }) => eq(table.userId, observer.id),
                },
              },
            });

            if (!workspace?.workspaceUsers.length)
              throw new Error("Unauthorized");

            // admin+ can create invitations
            if (workspace.workspaceUsers[0].role === "member")
              throw new Error("Unauthorized");
          } else {
            // for update/delete, verify permissions
            const invitation = await db.query.invitationsTable.findFirst({
              where: (table, { eq }) => eq(table.id, input),
              with: {
                workspace: {
                  with: {
                    workspaceUsers: {
                      where: (table, { eq }) => eq(table.userId, observer.id),
                    },
                  },
                },
              },
            });

            if (!invitation) throw new Error("Unauthorized");

            // Special case: Allow user to delete their own invitation (after accepting or rejecting)
            const isOwnInvitation = invitation.email === observer.email;

            if (scope === "delete" && isOwnInvitation) {
              // User can delete their own invitation
              return;
            }

            // Otherwise, require workspace membership with admin+ role
            if (!invitation.workspace.workspaceUsers.length)
              throw new Error("Unauthorized");

            // admin+ can modify/delete invitations
            if (invitation.workspace.workspaceUsers[0].role === "member")
              throw new Error("Unauthorized");
          }
        });

        return plan();
      },
    [context, sideEffect, propName, scope],
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
