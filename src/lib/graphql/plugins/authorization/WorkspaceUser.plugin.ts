import { EXPORTABLE } from "graphile-export";
import { context, sideEffect } from "postgraphile/grafast";
import { wrapPlans } from "postgraphile/utils";

import {
  BASIC_TIER_MAX_ADMINS,
  BASIC_TIER_MAX_MEMBERS,
  FREE_TIER_MAX_ADMINS,
  FREE_TIER_MAX_MEMBERS,
  isBillingExempt,
} from "./constants";

import type { InsertWorkspaceUser } from "lib/db/schema";
import type { PlanWrapperFn } from "postgraphile/utils";

/**
 * Validate workspace user permissions for create and update.
 *
 * Team management requires admin+ role.
 * - Create: Admin+ can add members (with tier limits)
 * - Update: Admin+ can change roles (except owner roles)
 *
 * Special rules:
 * - Cannot modify owner roles
 * - Tier-based limits on members and admins
 */
const validatePermissions = (propName: string, scope: "create" | "update") =>
  EXPORTABLE(
    (
      context,
      sideEffect,
      propName,
      scope,
      FREE_TIER_MAX_MEMBERS,
      FREE_TIER_MAX_ADMINS,
      BASIC_TIER_MAX_MEMBERS,
      BASIC_TIER_MAX_ADMINS,
      isBillingExempt,
    ): PlanWrapperFn =>
      (plan, _, fieldArgs) => {
        const $input = fieldArgs.getRaw(["input", propName]);
        const $observer = context().get("observer");
        const $db = context().get("db");

        sideEffect([$input, $observer, $db], async ([input, observer, db]) => {
          if (!observer) throw new Error("Unauthorized");

          if (scope === "create") {
            const workspaceId = (input as InsertWorkspaceUser).workspaceId;
            const newMemberUserId = (input as InsertWorkspaceUser).userId;
            const newMemberRole = (input as InsertWorkspaceUser).role;

            const workspace = await db.query.workspaceTable.findFirst({
              where: (table, { eq }) => eq(table.id, workspaceId),
              with: {
                workspaceUsers: true,
              },
            });

            if (!workspace) throw new Error("Unauthorized");

            // Special case: Allow adding yourself as owner to an empty workspace (initial setup)
            const isInitialOwnerSetup =
              workspace.workspaceUsers.length === 0 &&
              newMemberUserId === observer.id &&
              newMemberRole === "owner";

            // Special case: Allow user to accept their own invitation
            let isAcceptingInvitation = false;
            if (newMemberUserId === observer.id) {
              const pendingInvitation =
                await db.query.invitationsTable.findFirst({
                  where: (table, { eq, and }) =>
                    and(
                      eq(table.workspaceId, workspaceId),
                      eq(table.email, observer.email),
                    ),
                });
              isAcceptingInvitation = !!pendingInvitation;
            }

            if (!isInitialOwnerSetup && !isAcceptingInvitation) {
              // Verify caller is a member and has admin+ role
              const callerMembership = workspace.workspaceUsers.find(
                (wu) => wu.userId === observer.id,
              );

              if (!callerMembership) throw new Error("Unauthorized");
              if (callerMembership.role === "member")
                throw new Error("Unauthorized");
            }

            // bypass tier limits for exempt workspaces
            if (!isBillingExempt(workspace.slug)) {
              // Tier-based member limits
              if (workspace.tier === "free") {
                if (workspace.workspaceUsers.length >= FREE_TIER_MAX_MEMBERS)
                  throw new Error("Maximum number of members reached");

                const numberOfAdmins = workspace.workspaceUsers.filter(
                  (member) => member.role !== "member",
                ).length;

                if (newMemberRole && newMemberRole !== "member") {
                  if (numberOfAdmins >= FREE_TIER_MAX_ADMINS)
                    throw new Error("Maximum number of admins reached");
                }
              }

              if (workspace.tier === "basic") {
                if (workspace.workspaceUsers.length >= BASIC_TIER_MAX_MEMBERS)
                  throw new Error("Maximum number of members reached");

                const numberOfAdmins = workspace.workspaceUsers.filter(
                  (member) => member.role !== "member",
                ).length;

                if (newMemberRole && newMemberRole !== "member") {
                  if (numberOfAdmins >= BASIC_TIER_MAX_ADMINS)
                    throw new Error("Maximum number of admins reached");
                }
              }
            }
          } else {
            // For update, input is the patch object with workspaceId and userId
            const targetWorkspaceId = (input as InsertWorkspaceUser)
              .workspaceId;
            const targetUserId = (input as InsertWorkspaceUser).userId;

            const workspace = await db.query.workspaceTable.findFirst({
              where: (table, { eq }) => eq(table.id, targetWorkspaceId),
              with: {
                workspaceUsers: true,
              },
            });

            if (!workspace) throw new Error("Unauthorized");

            // Verify caller is a member and has admin+ role
            const callerMembership = workspace.workspaceUsers.find(
              (wu) => wu.userId === observer.id,
            );

            if (!callerMembership) throw new Error("Unauthorized");
            if (callerMembership.role === "member")
              throw new Error("Unauthorized");

            // Find the target member
            const targetMember = workspace.workspaceUsers.find(
              (wu) => wu.userId === targetUserId,
            );

            if (!targetMember) throw new Error("Not found");

            // Cannot modify owners
            if (targetMember.role === "owner") {
              throw new Error("Cannot modify owner");
            }

            // Check tier limits for admin promotions (bypass for exempt workspaces)
            const newRole = (input as InsertWorkspaceUser).role;

            if (
              newRole &&
              newRole !== "member" &&
              !isBillingExempt(workspace.slug)
            ) {
              const numberOfAdmins = workspace.workspaceUsers.filter(
                (member) => member.role !== "member",
              ).length;

              // If promoting to admin/owner, check limits
              // (but exclude current target if they're already an admin)
              const currentIsAdmin = targetMember.role !== "member";
              const effectiveAdminCount = currentIsAdmin
                ? numberOfAdmins
                : numberOfAdmins + 1;

              if (
                workspace.tier === "free" &&
                effectiveAdminCount > FREE_TIER_MAX_ADMINS
              )
                throw new Error("Maximum number of admins reached");

              if (
                workspace.tier === "basic" &&
                effectiveAdminCount > BASIC_TIER_MAX_ADMINS
              )
                throw new Error("Maximum number of admins reached");
            }

            // Cannot promote to owner
            if (newRole === "owner") {
              throw new Error("Cannot promote to owner");
            }
          }
        });

        return plan();
      },
    [
      context,
      sideEffect,
      propName,
      scope,
      FREE_TIER_MAX_MEMBERS,
      FREE_TIER_MAX_ADMINS,
      BASIC_TIER_MAX_MEMBERS,
      BASIC_TIER_MAX_ADMINS,
      isBillingExempt,
    ],
  );

/**
 * Validate workspace user delete permissions.
 *
 * Delete mutation has userId and workspaceId directly on input (not nested in patch).
 * - Admin+ can remove members (except owners)
 */
const validateDeletePermissions = (): PlanWrapperFn =>
  EXPORTABLE(
    (context, sideEffect): PlanWrapperFn =>
      (plan, _, fieldArgs) => {
        const $workspaceId = fieldArgs.getRaw(["input", "workspaceId"]);
        const $userId = fieldArgs.getRaw(["input", "userId"]);
        const $observer = context().get("observer");
        const $db = context().get("db");

        sideEffect(
          [$workspaceId, $userId, $observer, $db],
          async ([workspaceId, userId, observer, db]) => {
            if (!observer) throw new Error("Unauthorized");

            const workspace = await db.query.workspaceTable.findFirst({
              where: (table, { eq }) => eq(table.id, workspaceId),
              with: {
                workspaceUsers: true,
              },
            });

            if (!workspace) throw new Error("Unauthorized");

            // Verify caller is a member and has admin+ role
            const callerMembership = workspace.workspaceUsers.find(
              (wu) => wu.userId === observer.id,
            );

            if (!callerMembership) throw new Error("Unauthorized");
            if (callerMembership.role === "member")
              throw new Error("Unauthorized");

            // Find the target member
            const targetMember = workspace.workspaceUsers.find(
              (wu) => wu.userId === userId,
            );

            if (!targetMember) throw new Error("Not found");

            // Cannot remove owners
            if (targetMember.role === "owner") {
              throw new Error("Cannot remove owner");
            }
          },
        );

        return plan();
      },
    [context, sideEffect],
  );

/**
 * Authorization plugin for workspace users (team management).
 *
 * Enforces admin+ requirement for team management.
 * Protects owner roles from modification.
 * Enforces tier-based member and admin limits.
 */
const WorkspaceUserPlugin = wrapPlans({
  Mutation: {
    createWorkspaceUser: validatePermissions("workspaceUser", "create"),
    updateWorkspaceUser: validatePermissions("patch", "update"),
    deleteWorkspaceUser: validateDeletePermissions(),
  },
});

export default WorkspaceUserPlugin;
