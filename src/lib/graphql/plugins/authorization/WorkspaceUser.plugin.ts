import { EXPORTABLE } from "graphile-export";
import { context, sideEffect } from "postgraphile/grafast";
import { wrapPlans } from "postgraphile/utils";

import {
  BASIC_TIER_MAX_ADMINS,
  BASIC_TIER_MAX_MEMBERS,
  FREE_TIER_MAX_ADMINS,
  FREE_TIER_MAX_MEMBERS,
} from "./constants";

import type { InsertWorkspaceUser } from "lib/db/schema";
import type { PlanWrapperFn } from "postgraphile/utils";
import type { MutationScope } from "./types";

/**
 * Validates workspace user permissions.
 *
 * Team management requires admin+ role.
 * - Create: Admin+ can add members (with tier limits)
 * - Update: Admin+ can change roles (except owner roles)
 * - Delete: Admin+ can remove members (except owners)
 *
 * Special rules:
 * - Cannot modify owner roles
 * - Cannot remove owners
 * - Tier-based limits on members and admins
 */
const validatePermissions = (propName: string, scope: MutationScope) =>
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

            if (!isInitialOwnerSetup) {
              // Verify caller is a member and has admin+ role
              const callerMembership = workspace.workspaceUsers.find(
                (wu) => wu.userId === observer.id,
              );

              if (!callerMembership) throw new Error("Unauthorized");
              if (callerMembership.role === "member")
                throw new Error("Unauthorized");
            }

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
          } else {
            // For update/delete, input contains workspaceId and userId of target
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

            // Cannot modify or remove owners
            if (targetMember.role === "owner") {
              throw new Error("Cannot modify owner");
            }

            // For update, check tier limits for admin promotions
            if (scope === "update") {
              const newRole = (input as InsertWorkspaceUser).role;

              if (newRole && newRole !== "member") {
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
    ],
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
    deleteWorkspaceUser: validatePermissions("patch", "delete"),
  },
});

export default WorkspaceUserPlugin;
