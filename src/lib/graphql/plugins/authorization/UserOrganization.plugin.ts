import { EXPORTABLE } from "graphile-export";
import { context, sideEffect } from "postgraphile/grafast";
import { wrapPlans } from "postgraphile/utils";

import { checkPermission } from "lib/authz";
import { isWithinLimit } from "lib/entitlements";
import { FEATURE_KEYS, billingBypassOrgIds } from "./constants";

import type { InsertUserOrganization } from "lib/db/schema";
import type { PlanWrapperFn } from "postgraphile/utils";
import type { MutationScope } from "./types";

/** Role hierarchy for rank comparison */
const ROLE_RANK: Record<string, number> = { owner: 3, admin: 2, member: 1 };

/**
 * Validate user organization permissions.
 *
 * - Create: Admin+ on target organization (PDP + DB fallback), with tier limits
 * - Update: Caller must outrank target; cannot change self or demote last owner
 * - Delete: Caller must outrank target; cannot remove self or last owner
 */
const validatePermissions = (propName: string, scope: MutationScope) =>
  EXPORTABLE(
    (
      context,
      sideEffect,
      checkPermission,
      isWithinLimit,
      FEATURE_KEYS,
      billingBypassOrgIds,
      ROLE_RANK,
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
              const memberInput = input as InsertUserOrganization;
              const organizationId = memberInput.organizationId;

              // Check admin permission via PDP
              const pdpAllowed = await checkPermission(
                observer.id,
                "organization",
                organizationId,
                "admin",
                accessToken,
                authzCache,
              );

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

              // Require admin+ via either PDP or DB role
              if (!pdpAllowed) {
                if (
                  !callerRole ||
                  (callerRole !== "owner" && callerRole !== "admin")
                ) {
                  throw new Error("Unauthorized");
                }
              }
              if (callerRole === "member") throw new Error("Unauthorized");

              // Tier limit: check max members
              const totalMembers = await withPgClient(
                null,
                async (client) => {
                  const result = await client.query<{ total: number }>({
                    text: "SELECT count(*)::int as total FROM user_organization WHERE organization_id = $1",
                    values: [organizationId],
                  });
                  return result.rows[0]?.total ?? 0;
                },
              );

              const withinLimit = await isWithinLimit(
                { organizationId },
                FEATURE_KEYS.MAX_MEMBERS,
                totalMembers,
                billingBypassOrgIds,
              );
              if (!withinLimit)
                throw new Error("Maximum number of members reached");

              // If adding an admin, check admin limit too
              if (
                memberInput.role === "admin" ||
                memberInput.role === "owner"
              ) {
                const totalAdmins = await withPgClient(
                  null,
                  async (client) => {
                    const result = await client.query<{ total: number }>({
                      text: "SELECT count(*)::int as total FROM user_organization WHERE organization_id = $1 AND role IN ('admin', 'owner')",
                      values: [organizationId],
                    });
                    return result.rows[0]?.total ?? 0;
                  },
                );

                const withinAdminLimit = await isWithinLimit(
                  { organizationId },
                  FEATURE_KEYS.MAX_ADMINS,
                  totalAdmins,
                  billingBypassOrgIds,
                );
                if (!withinAdminLimit)
                  throw new Error("Maximum number of admins reached");
              }

              // Provision defaults for team organizations
              if (memberInput.type === "team") {
                await withPgClient(null, async (client) => {
                  const existing = await client.query<{ id: string }>({
                    text: "SELECT id FROM project_column WHERE organization_id = $1 LIMIT 1",
                    values: [organizationId],
                  });
                  if (existing.rows.length === 0) {
                    await client.query({
                      text: "INSERT INTO project_column (organization_id, emoji, title, index) VALUES ($1, '\u{1F5D3}', 'Planned', 0), ($1, '\u{1F6A7}', 'In Progress', 1), ($1, '\u2705', 'Completed', 2)",
                      values: [organizationId],
                    });
                  }
                });

                await withPgClient(null, async (client) => {
                  const existing = await client.query<{ id: string }>({
                    text: "SELECT id FROM settings WHERE organization_id = $1 LIMIT 1",
                    values: [organizationId],
                  });
                  if (existing.rows.length === 0) {
                    await client.query({
                      text: "INSERT INTO settings (organization_id, view_mode) VALUES ($1, 'board')",
                      values: [organizationId],
                    });
                  }
                });
              }
            } else {
              // Update or delete: look up the target membership
              const targetRowId = input as string;

              const target = await withPgClient(null, async (client) => {
                const result = await client.query<{
                  user_id: string;
                  organization_id: string;
                  role: string;
                }>({
                  text: "SELECT user_id, organization_id, role FROM user_organization WHERE id = $1",
                  values: [targetRowId],
                });
                return result.rows[0] ?? null;
              });
              if (!target) throw new Error("Membership not found");

              // Prevent self-modification
              if (target.user_id === observer.id) {
                throw new Error("Cannot modify your own membership");
              }

              // Get caller's role in the same organization
              const callerRole = await withPgClient(
                null,
                async (client) => {
                  const result = await client.query<{ role: string }>({
                    text: "SELECT role FROM user_organization WHERE user_id = $1 AND organization_id = $2",
                    values: [observer.id, target.organization_id],
                  });
                  return result.rows[0]?.role ?? null;
                },
              );

              if (!callerRole) throw new Error("Unauthorized");

              // Caller must outrank the target
              if (
                (ROLE_RANK[callerRole] ?? 0) <= (ROLE_RANK[target.role] ?? 0)
              ) {
                throw new Error("Unauthorized");
              }

              // Prevent removing the last owner
              if (target.role === "owner") {
                const ownerCount = await withPgClient(
                  null,
                  async (client) => {
                    const result = await client.query<{ total: number }>({
                      text: "SELECT count(*)::int as total FROM user_organization WHERE organization_id = $1 AND role = 'owner'",
                      values: [target.organization_id],
                    });
                    return result.rows[0]?.total ?? 0;
                  },
                );
                if (ownerCount <= 1) {
                  throw new Error("Cannot remove the last owner");
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
      isWithinLimit,
      FEATURE_KEYS,
      billingBypassOrgIds,
      ROLE_RANK,
      propName,
      scope,
    ],
  );

/**
 * Authorization plugin for user organization memberships.
 *
 * Enforces role-based hierarchy for member management.
 * Enforces tier-based member and admin limits.
 */
const UserOrganizationPlugin = wrapPlans({
  Mutation: {
    createUserOrganization: validatePermissions(
      "userOrganization",
      "create",
    ),
    updateUserOrganization: validatePermissions("rowId", "update"),
    deleteUserOrganization: validatePermissions("rowId", "delete"),
  },
});

export default UserOrganizationPlugin;
