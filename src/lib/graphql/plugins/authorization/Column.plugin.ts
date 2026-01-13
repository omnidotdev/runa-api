import { EXPORTABLE } from "graphile-export";
import { context, sideEffect } from "postgraphile/grafast";
import { wrapPlans } from "postgraphile/utils";

import { AUTHZ_ENABLED, AUTHZ_PROVIDER_URL, checkPermission } from "lib/authz";
import { isWithinLimit } from "lib/entitlements";
import { FEATURE_KEYS, billingBypassOrgIds } from "./constants";

import type { InsertColumn, members } from "lib/db/schema";
import type { PlanWrapperFn } from "postgraphile/utils";
import type { MutationScope } from "./types";

/**
 * Check if user has admin+ role on project's workspace via member table.
 * This handles the race condition where tuple sync hasn't completed yet.
 */
const checkMemberTablePermission = async (
  // biome-ignore lint/suspicious/noExplicitAny: db type from postgraphile context
  db: any,
  userId: string,
  projectId: string,
): Promise<boolean> => {
  // Get workspace from project
  const project = await db.query.projects.findFirst({
    // biome-ignore lint/suspicious/noExplicitAny: drizzle query builder callback
    where: (table: any, { eq }: any) => eq(table.id, projectId),
    columns: { workspaceId: true },
  });
  if (!project) return false;

  const membership = await db.query.members.findFirst({
    // biome-ignore lint/suspicious/noExplicitAny: drizzle query builder callback
    where: (table: typeof members, { and, eq }: any) =>
      and(eq(table.userId, userId), eq(table.workspaceId, project.workspaceId)),
  });
  return membership?.role === "owner" || membership?.role === "admin";
};

/**
 * Validate column permissions via PDP.
 *
 * - Create: Admin permission on project required (with tier limits)
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

        const $authzCache = context().get("authzCache");

        sideEffect(
          [$input, $observer, $db, $authzCache],
          async ([input, observer, db, authzCache]) => {
            if (!observer) throw new Error("Unauthorized");

            if (scope !== "create") {
              // Get column to find project for AuthZ check
              const column = await db.query.columns.findFirst({
                where: (table, { eq }) => eq(table.id, input),
                columns: { projectId: true },
              });
              if (!column) throw new Error("Column not found");

              let allowed = await checkPermission(
                AUTHZ_ENABLED,
                AUTHZ_PROVIDER_URL,
                observer.id,
                "project",
                column.projectId,
                "admin",
                authzCache,
              );

              // Fallback: check member table directly (handles race condition)
              if (!allowed) {
                allowed = await checkMemberTablePermission(
                  db,
                  observer.id,
                  column.projectId,
                );
              }
              if (!allowed) throw new Error("Unauthorized");
            } else {
              const projectId = (input as InsertColumn).projectId;

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
                allowed = await checkMemberTablePermission(
                  db,
                  observer.id,
                  projectId,
                );
              }
              if (!allowed) throw new Error("Unauthorized");

              // Get project with columns and workspace for tier limit check
              const project = await db.query.projects.findFirst({
                where: (table, { eq }) => eq(table.id, projectId),
                with: { columns: true, workspace: true },
              });
              if (!project) throw new Error("Project not found");

              const withinLimit = await isWithinLimit(
                project.workspace,
                FEATURE_KEYS.MAX_COLUMNS,
                project.columns.length,
                billingBypassOrgIds,
              );
              if (!withinLimit)
                throw new Error("Maximum number of columns reached");
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
 * Authorization plugin for columns.
 */
const ColumnPlugin = wrapPlans({
  Mutation: {
    createColumn: validatePermissions("column", "create"),
    updateColumn: validatePermissions("rowId", "update"),
    deleteColumn: validatePermissions("rowId", "delete"),
  },
});

export default ColumnPlugin;
