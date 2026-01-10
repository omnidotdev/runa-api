import { EXPORTABLE } from "graphile-export";
import { context, sideEffect } from "postgraphile/grafast";
import { wrapPlans } from "postgraphile/utils";

import { AUTHZ_ENABLED, AUTHZ_PROVIDER_URL, checkPermission } from "lib/authz";

import type { InsertProjectColumn } from "lib/db/schema";
import type { PlanWrapperFn } from "postgraphile/utils";
import type { MutationScope } from "./types";

/**
 * Validate project column permissions via Warden.
 *
 * - Create: Admin permission on workspace required
 * - Update: Admin permission on workspace required
 * - Delete: Admin permission on workspace required
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

        sideEffect([$input, $observer, $db], async ([input, observer, db]) => {
          if (!observer) throw new Error("Unauthorized");

          if (scope === "create") {
            const workspaceId = (input as InsertProjectColumn).workspaceId;

            const allowed = await checkPermission(
              AUTHZ_ENABLED,
              AUTHZ_PROVIDER_URL,
              observer.id,
              "workspace",
              workspaceId,
              "admin",
            );
            if (!allowed) throw new Error("Unauthorized");
          } else {
            // Get project column to find workspace for AuthZ check
            const projectColumn = await db.query.projectColumnTable.findFirst({
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
            if (!allowed) throw new Error("Unauthorized");
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
