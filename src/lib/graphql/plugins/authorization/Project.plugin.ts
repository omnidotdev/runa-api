import { EXPORTABLE } from "graphile-export";
import { context, sideEffect } from "postgraphile/grafast";
import { wrapPlans } from "postgraphile/utils";

import { AUTHZ_ENABLED, AUTHZ_PROVIDER_URL, checkPermission } from "lib/authz";
import { isWithinLimit } from "lib/entitlements";
import { FEATURE_KEYS, billingBypassOrgIds } from "./constants";

import type { InsertProject, members } from "lib/db/schema";
import type { PlanWrapperFn } from "postgraphile/utils";
import type { MutationScope } from "./types";

/**
 * Check if user has admin+ role in member table (fallback for race conditions).
 * This handles the case where AuthzSync hasn't persisted the tuple yet.
 */
const checkMemberTablePermission = async (
  // biome-ignore lint/suspicious/noExplicitAny: db type from postgraphile context
  db: any,
  userId: string,
  workspaceId: string,
): Promise<boolean> => {
  const membership = await db.query.members.findFirst({
    // biome-ignore lint/suspicious/noExplicitAny: drizzle query builder callback
    where: (table: typeof members, { and, eq }: any) =>
      and(eq(table.userId, userId), eq(table.workspaceId, workspaceId)),
  });
  return membership?.role === "owner" || membership?.role === "admin";
};

/**
 * Validate project permissions via PDP.
 *
 * - Create: Admin permission on workspace required (with tier limits)
 * - Update: Admin permission on project required
 * - Delete: Admin permission on project required
 */
const validatePermissions = (propName: string, scope: MutationScope) =>
  EXPORTABLE(
    (
      context,
      sideEffect,
      AUTHZ_ENABLED,
      AUTHZ_PROVIDER_URL,
      checkPermission,
      checkMemberTablePermission,
      isWithinLimit,
      FEATURE_KEYS,
      billingBypassOrgIds,
      propName,
      scope,
    ): PlanWrapperFn =>
      (plan, _, fieldArgs) => {
        const $input = fieldArgs.getRaw(["input", propName]);
        const $observer = context().get("observer");
        const $db = context().get("db");
        const $withPgClient = context().get("withPgClient");
        const $authzCache = context().get("authzCache");

        sideEffect(
          [$input, $observer, $db, $withPgClient, $authzCache],
          async ([input, observer, db, withPgClient, authzCache]) => {
            if (!observer) throw new Error("Unauthorized");

            if (scope === "create") {
              const workspaceId = (input as InsertProject).workspaceId;

              // Check OpenFGA first
              let allowed = await checkPermission(
                AUTHZ_ENABLED,
                AUTHZ_PROVIDER_URL,
                observer.id,
                "workspace",
                workspaceId,
                "admin",
                authzCache,
              );

              // Fallback: check member table directly (handles race condition
              // where tuple sync hasn't completed yet)
              if (!allowed) {
                allowed = await checkMemberTablePermission(
                  db,
                  observer.id,
                  workspaceId,
                );
              }
              if (!allowed) throw new Error("Unauthorized");

              // Get workspace for tier limit check
              const workspace = await db.query.workspaces.findFirst({
                where: (table, { eq }) => eq(table.id, workspaceId),
              });
              if (!workspace) throw new Error("Workspace not found");

              const totalProjects = await withPgClient(null, async (client) => {
                const result = await client.query({
                  text: "SELECT count(*)::int as total FROM project WHERE workspace_id = $1",
                  values: [workspaceId],
                });
                return (
                  (result.rows[0] as { total: number } | undefined)?.total ?? 0
                );
              });

              const withinLimit = await isWithinLimit(
                workspace,
                FEATURE_KEYS.MAX_PROJECTS,
                totalProjects,
                billingBypassOrgIds,
              );
              if (!withinLimit)
                throw new Error("Maximum number of projects reached");
            } else {
              // For update/delete, check permission on the project
              const projectId = input as string;

              let allowed = await checkPermission(
                AUTHZ_ENABLED,
                AUTHZ_PROVIDER_URL,
                observer.id,
                "project",
                projectId,
                "admin",
                authzCache,
              );

              // Fallback: check member table directly (handles race condition)
              if (!allowed) {
                // Get workspace from project to check membership
                const project = await db.query.projects.findFirst({
                  where: (table, { eq }) => eq(table.id, projectId),
                  columns: { workspaceId: true },
                });
                if (project) {
                  allowed = await checkMemberTablePermission(
                    db,
                    observer.id,
                    project.workspaceId,
                  );
                }
              }
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
      checkMemberTablePermission,
      isWithinLimit,
      FEATURE_KEYS,
      billingBypassOrgIds,
      propName,
      scope,
    ],
  );

/**
 * Authorization plugin for projects.
 *
 * Enforces admin+ requirement for project management.
 * Enforces tier-based project limits.
 */
const ProjectPlugin = wrapPlans({
  Mutation: {
    createProject: validatePermissions("project", "create"),
    updateProject: validatePermissions("rowId", "update"),
    deleteProject: validatePermissions("rowId", "delete"),
  },
});

export default ProjectPlugin;
