import { EXPORTABLE } from "graphile-export";
import { context, sideEffect } from "postgraphile/grafast";
import { wrapPlans } from "postgraphile/utils";

import { AUTHZ_ENABLED, AUTHZ_PROVIDER_URL, checkPermission } from "lib/authz";
import { checkWorkspaceLimit } from "lib/entitlements";
import { FEATURE_KEYS, billingBypassSlugs } from "./constants";

import type { InsertWorkspaceUser } from "lib/db/schema";
import type { PlanWrapperFn } from "postgraphile/utils";

/**
 * Validate workspace user permissions via Warden.
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
      checkWorkspaceLimit,
      FEATURE_KEYS,
      billingBypassSlugs,
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
              const workspaceId = (input as InsertWorkspaceUser).workspaceId;
              const newMemberUserId = (input as InsertWorkspaceUser).userId;
              const newMemberRole = (input as InsertWorkspaceUser).role;

              const workspace = await db.query.workspaceTable.findFirst({
                where: (table, { eq }) => eq(table.id, workspaceId),
                with: { workspaceUsers: true },
              });
              if (!workspace) throw new Error("Workspace not found");

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

              // Check tier limits via entitlements service (bypass for exempt workspaces)
              if (!billingBypassSlugs.includes(workspace.slug)) {
                const withinMemberLimit = await checkWorkspaceLimit(
                  workspace.id,
                  FEATURE_KEYS.MAX_MEMBERS,
                  workspace.workspaceUsers.length,
                  workspace.tier as "free" | "basic" | "team",
                );
                if (!withinMemberLimit)
                  throw new Error("Maximum number of members reached");

                // Check admin limit if adding as admin+
                if (newMemberRole && newMemberRole !== "member") {
                  const numberOfAdmins = workspace.workspaceUsers.filter(
                    (member) => member.role !== "member",
                  ).length;

                  const withinAdminLimit = await checkWorkspaceLimit(
                    workspace.id,
                    FEATURE_KEYS.MAX_ADMINS,
                    numberOfAdmins,
                    workspace.tier as "free" | "basic" | "team",
                  );
                  if (!withinAdminLimit)
                    throw new Error("Maximum number of admins reached");
                }
              }
            } else {
              const targetWorkspaceId = (input as InsertWorkspaceUser)
                .workspaceId;
              const targetUserId = (input as InsertWorkspaceUser).userId;

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
              const workspace = await db.query.workspaceTable.findFirst({
                where: (table, { eq }) => eq(table.id, targetWorkspaceId),
                with: { workspaceUsers: true },
              });
              if (!workspace) throw new Error("Workspace not found");

              // Find the target member
              const targetMember = workspace.workspaceUsers.find(
                (wu) => wu.userId === targetUserId,
              );
              if (!targetMember) throw new Error("Not found");

              // Cannot modify owners
              if (targetMember.role === "owner") {
                throw new Error("Cannot modify owner");
              }

              // Check tier limits for admin promotions
              const newRole = (input as InsertWorkspaceUser).role;

              if (
                newRole &&
                newRole !== "member" &&
                !billingBypassSlugs.includes(workspace.slug)
              ) {
                const numberOfAdmins = workspace.workspaceUsers.filter(
                  (member) => member.role !== "member",
                ).length;

                const withinAdminLimit = await checkWorkspaceLimit(
                  workspace.id,
                  FEATURE_KEYS.MAX_ADMINS,
                  numberOfAdmins,
                  workspace.tier as "free" | "basic" | "team",
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
      checkWorkspaceLimit,
      FEATURE_KEYS,
      billingBypassSlugs,
      propName,
      scope,
    ],
  );

/**
 * Validate workspace user delete permissions via Warden.
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
            const workspace = await db.query.workspaceTable.findFirst({
              where: (table, { eq }) => eq(table.id, workspaceId),
              with: { workspaceUsers: true },
            });
            if (!workspace) throw new Error("Workspace not found");

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
    [context, sideEffect, AUTHZ_ENABLED, AUTHZ_PROVIDER_URL, checkPermission],
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
