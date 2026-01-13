import { EXPORTABLE } from "graphile-export";
import { context, sideEffect } from "postgraphile/grafast";
import { wrapPlans } from "postgraphile/utils";

import { AUTHZ_ENABLED, AUTHZ_PROVIDER_URL, checkPermission } from "lib/authz";
import { isWithinLimit } from "lib/entitlements";
import { AUTH_BASE_URL, addOrgMember } from "lib/idp/client";
import { FEATURE_KEYS, billingBypassOrgIds } from "./constants";

import type { InsertMember } from "lib/db/schema";
import type { PlanWrapperFn } from "postgraphile/utils";

/**
 * Validate member permissions via PDP.
 *
 * - Create: Admin permission on workspace required (with tier limits)
 * - Update: Admin permission on workspace required
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
      AUTHZ_ENABLED,
      AUTHZ_PROVIDER_URL,
      checkPermission,
      isWithinLimit,
      AUTH_BASE_URL,
      addOrgMember,
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

        sideEffect(
          [$input, $observer, $db, $authzCache],
          async ([input, observer, db, authzCache]) => {
            if (!observer) throw new Error("Unauthorized");

            if (scope === "create") {
              const workspaceId = (input as InsertMember).workspaceId;
              const newMemberUserId = (input as InsertMember).userId;
              const newMemberRole = (input as InsertMember).role;

              const workspace = await db.query.workspaces.findFirst({
                where: (table, { eq }) => eq(table.id, workspaceId),
                with: { members: true },
              });
              if (!workspace) throw new Error("Workspace not found");

              // Special case: Allow adding yourself as owner to an empty workspace (initial setup)
              const isInitialOwnerSetup =
                workspace.members.length === 0 &&
                newMemberUserId === observer.id &&
                newMemberRole === "owner";

              // Special case: Allow user to accept their own invitation
              let isAcceptingInvitation = false;
              if (newMemberUserId === observer.id) {
                const pendingInvitation = await db.query.invitations.findFirst({
                  where: (table, { eq, and }) =>
                    and(
                      eq(table.workspaceId, workspaceId),
                      eq(table.email, observer.email),
                    ),
                });
                isAcceptingInvitation = !!pendingInvitation;
              }

              if (!isInitialOwnerSetup && !isAcceptingInvitation) {
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
              }

              // Sync org membership to IDP when accepting invitation
              if (isAcceptingInvitation && AUTH_BASE_URL) {
                addOrgMember(AUTH_BASE_URL, {
                  organizationId: workspace.organizationId,
                  userId: observer.id,
                  role: "member",
                }).catch((err) =>
                  console.error("Failed to sync org membership to IDP:", err),
                );
              }

              // Check tier limits via entitlements service
              const withinMemberLimit = await isWithinLimit(
                workspace,
                FEATURE_KEYS.MAX_MEMBERS,
                workspace.members.length,
                billingBypassOrgIds,
              );
              if (!withinMemberLimit)
                throw new Error("Maximum number of members reached");

              // Check admin limit if adding as admin+
              if (newMemberRole && newMemberRole !== "member") {
                const numberOfAdmins = workspace.members.filter(
                  (member) => member.role !== "member",
                ).length;

                const withinAdminLimit = await isWithinLimit(
                  workspace,
                  FEATURE_KEYS.MAX_ADMINS,
                  numberOfAdmins,
                  billingBypassOrgIds,
                );
                if (!withinAdminLimit)
                  throw new Error("Maximum number of admins reached");
              }
            } else {
              const targetWorkspaceId = (input as InsertMember).workspaceId;
              const targetUserId = (input as InsertMember).userId;

              const allowed = await checkPermission(
                AUTHZ_ENABLED,
                AUTHZ_PROVIDER_URL,
                observer.id,
                "workspace",
                targetWorkspaceId,
                "admin",
                authzCache,
              );
              if (!allowed) throw new Error("Unauthorized");

              // Get workspace with members for business logic checks
              const workspace = await db.query.workspaces.findFirst({
                where: (table, { eq }) => eq(table.id, targetWorkspaceId),
                with: { members: true },
              });
              if (!workspace) throw new Error("Workspace not found");

              // Find the target member
              const targetMember = workspace.members.find(
                (wu) => wu.userId === targetUserId,
              );
              if (!targetMember) throw new Error("Not found");

              // Cannot modify owners
              if (targetMember.role === "owner") {
                throw new Error("Cannot modify owner");
              }

              // Check tier limits for admin promotions
              const newRole = (input as InsertMember).role;

              if (newRole && newRole !== "member") {
                const numberOfAdmins = workspace.members.filter(
                  (member) => member.role !== "member",
                ).length;

                const withinAdminLimit = await isWithinLimit(
                  workspace,
                  FEATURE_KEYS.MAX_ADMINS,
                  numberOfAdmins,
                  billingBypassOrgIds,
                );
                if (!withinAdminLimit)
                  throw new Error("Maximum number of admins reached");
              }

              // Cannot promote to owner
              if (newRole === "owner") {
                throw new Error("Cannot promote to owner");
              }
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
      isWithinLimit,
      AUTH_BASE_URL,
      addOrgMember,
      FEATURE_KEYS,
      billingBypassOrgIds,
      propName,
      scope,
    ],
  );

/**
 * Validate member delete permissions via PDP.
 *
 * - Admin permission on workspace required
 * - Cannot remove owners
 */
const validateDeletePermissions = (): PlanWrapperFn =>
  EXPORTABLE(
    (
      context,
      sideEffect,
      AUTHZ_ENABLED,
      AUTHZ_PROVIDER_URL,
      checkPermission,
    ): PlanWrapperFn =>
      (plan, _, fieldArgs) => {
        const $workspaceId = fieldArgs.getRaw(["input", "workspaceId"]);
        const $userId = fieldArgs.getRaw(["input", "userId"]);
        const $observer = context().get("observer");
        const $db = context().get("db");
        const $authzCache = context().get("authzCache");

        sideEffect(
          [$workspaceId, $userId, $observer, $db, $authzCache],
          async ([workspaceId, userId, observer, db, authzCache]) => {
            if (!observer) throw new Error("Unauthorized");

            const allowed = await checkPermission(
              AUTHZ_ENABLED,
              AUTHZ_PROVIDER_URL,
              observer.id,
              "workspace",
              workspaceId as string,
              "admin",
              authzCache,
            );
            if (!allowed) throw new Error("Unauthorized");

            // Get workspace members to check target's role
            const workspace = await db.query.workspaces.findFirst({
              where: (table, { eq }) => eq(table.id, workspaceId),
              with: { members: true },
            });
            if (!workspace) throw new Error("Workspace not found");

            // Find the target member
            const targetMember = workspace.members.find(
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
    [context, sideEffect, AUTHZ_ENABLED, AUTHZ_PROVIDER_URL, checkPermission],
  );

/**
 * Authorization plugin for members (team management).
 *
 * Enforces admin+ requirement for team management.
 * Protects owner roles from modification.
 * Enforces tier-based member and admin limits.
 * Syncs org membership to IDP when accepting invitations.
 */
const MemberPlugin = wrapPlans({
  Mutation: {
    createMember: validatePermissions("member", "create"),
    updateMember: validatePermissions("patch", "update"),
    deleteMember: validateDeletePermissions(),
  },
});

export default MemberPlugin;
