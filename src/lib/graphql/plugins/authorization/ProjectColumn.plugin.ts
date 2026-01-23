import { EXPORTABLE } from "graphile-export";
import { context, sideEffect } from "postgraphile/grafast";
import { wrapPlans } from "postgraphile/utils";

import { checkPermission } from "lib/authz";

import type { InsertProjectColumn } from "lib/db/schema";
import type { PlanWrapperFn } from "postgraphile/utils";
import type { MutationScope } from "./types";

/**
 * Validate project column permissions via PDP.
 *
 * - Create: Admin permission on organization required
 * - Update: Admin permission on organization required
 * - Delete: Admin permission on organization required
 *
 * Note: Member tuples are synced to PDP by IDP (Gatekeeper), so we rely
 * entirely on PDP checks. No local member table fallback.
 */
const validatePermissions = (propName: string, scope: MutationScope) =>
  EXPORTABLE(
    (context, sideEffect, checkPermission, propName, scope): PlanWrapperFn =>
      (plan, _, fieldArgs) => {
        const $input = fieldArgs.getRaw(["input", propName]);
        const $observer = context().get("observer");
        const $db = context().get("db");
        const $authzCache = context().get("authzCache");
        const $accessToken = context().get("accessToken");

        sideEffect(
          [$input, $observer, $db, $authzCache, $accessToken],
          async ([input, observer, db, authzCache, accessToken]) => {
            if (!observer) throw new Error("Unauthorized");
            if (!accessToken) throw new Error("Unauthorized");

            if (scope === "create") {
              const organizationId = (input as InsertProjectColumn)
                .organizationId;

              const allowed = await checkPermission(
                observer.id,
                "organization",
                organizationId,
                "admin",
                accessToken,
                authzCache,
              );
              if (!allowed) throw new Error("Unauthorized");
            } else {
              // Get project column to find organization for AuthZ check
              const projectColumn = await db.query.projectColumns.findFirst({
                where: (table, { eq }) => eq(table.id, input),
                columns: { organizationId: true },
              });
              if (!projectColumn) throw new Error("Project column not found");

              const allowed = await checkPermission(
                observer.id,
                "organization",
                projectColumn.organizationId,
                "admin",
                accessToken,
                authzCache,
              );
              if (!allowed) throw new Error("Unauthorized");
            }
          },
        );

        return plan();
      },
    [context, sideEffect, checkPermission, propName, scope],
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
