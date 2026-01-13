import { EXPORTABLE } from "graphile-export";
import { context, sideEffect } from "postgraphile/grafast";
import { wrapPlans } from "postgraphile/utils";

import { AUTHZ_ENABLED, AUTHZ_PROVIDER_URL, checkPermission } from "lib/authz";

import type { InsertProjectColumn, members } from "lib/db/schema";
import type { PlanWrapperFn } from "postgraphile/utils";
import type { MutationScope } from "./types";

/**
 * Validate project column permissions via PDP.
 *
 * - Create: Admin permission on workspace required
 * - Update: Admin permission on workspace required
 * - Delete: Admin permission on workspace required
 */
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

const validatePermissions = (propName: string, scope: MutationScope) =>
  EXPORTABLE(
    (
      context,
      sideEffect,
      AUTHZ_ENABLED,
      AUTHZ_PROVIDER_URL,
      checkPermission,
      checkMemberTablePermission,
      propName,
      scope,
    ): PlanWrapperFn =>
      (plan, _, fieldArgs) => {
        const $input = fieldArgs.getRaw(["input", propName]);
        const $observer = context().get("observer");
        const $db = context().get("db");

        sideEffect([$input, $observer, $db], async ([input, observer, db]) => {
          if (!observer) throw new Error("Unauthorized");

          if (scope === "create") {
            const workspaceId = (input as InsertProjectColumn).workspaceId;

            // Check OpenFGA first
            const allowed = await checkPermission(
              AUTHZ_ENABLED,
              AUTHZ_PROVIDER_URL,
              observer.id,
              "workspace",
              workspaceId,
              "admin",
            );

            // Fallback: check member table directly (handles race condition
            // where tuple sync hasn't completed yet)
            if (!allowed) {
              const memberAllowed = await checkMemberTablePermission(
                db,
                observer.id,
                workspaceId,
              );
              if (!memberAllowed) throw new Error("Unauthorized");
            }
          } else {
            // Get project column to find workspace for AuthZ check
            const projectColumn = await db.query.projectColumns.findFirst({
              where: (table, { eq }) => eq(table.id, input),
              columns: { workspaceId: true },
            });
            if (!projectColumn) throw new Error("Project column not found");

            const allowed = await checkPermission(
              AUTHZ_ENABLED,
              AUTHZ_PROVIDER_URL,
              observer.id,
              "workspace",
              projectColumn.workspaceId,
              "admin",
            );

            // Fallback: check member table directly
            if (!allowed) {
              const memberAllowed = await checkMemberTablePermission(
                db,
                observer.id,
                projectColumn.workspaceId,
              );
              if (!memberAllowed) throw new Error("Unauthorized");
            }
          }
        });

        return plan();
      },
    [
      context,
      sideEffect,
      AUTHZ_ENABLED,
      AUTHZ_PROVIDER_URL,
      checkPermission,
      checkMemberTablePermission,
      propName,
      scope,
    ],
  );

/**
 * Authorization plugin for project columns.
 *
 * Enforces admin+ requirement for project column management.
 */
const ProjectColumnPlugin = wrapPlans({
  Mutation: {
    createProjectColumn: validatePermissions("projectColumn", "create"),
    updateProjectColumn: validatePermissions("rowId", "update"),
    deleteProjectColumn: validatePermissions("rowId", "delete"),
  },
});

export default ProjectColumnPlugin;
