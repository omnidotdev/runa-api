import { EXPORTABLE } from "graphile-export";
import { context, sideEffect } from "postgraphile/grafast";
import { wrapPlans } from "postgraphile/utils";

import type { PlanWrapperFn } from "postgraphile/utils";
import type { MutationScope } from "./types";

/**
 * Validate workspace permissions.
 *
 * - Create: Any authenticated user can create a workspace
 * - Update: Admin+ can update workspace settings
 * - Delete: Owner only (cannot be delegated)
 */
const validatePermissions = (propName: string, scope: MutationScope) =>
  EXPORTABLE(
    (context, sideEffect, propName, scope): PlanWrapperFn =>
      (plan, _, fieldArgs) => {
        const $input = fieldArgs.getRaw(["input", propName]);
        const $observer = context().get("observer");
        const $db = context().get("db");

        sideEffect([$input, $observer, $db], async ([input, observer, db]) => {
          if (!observer) throw new Error("Unauthorized");

          if (scope !== "create") {
            const workspace = await db.query.workspaceTable.findFirst({
              where: (table, { eq }) => eq(table.id, input),
              with: {
                workspaceUsers: {
                  where: (table, { eq }) => eq(table.userId, observer.id),
                },
              },
            });

            if (!workspace || !workspace.workspaceUsers.length)
              throw new Error("Unauthorized");

            const role = workspace.workspaceUsers[0].role;

            if (scope === "delete") {
              // only owner can delete workspace
              if (role !== "owner") throw new Error("Unauthorized");
            } else if (scope === "update") {
              // admin+ can update workspace
              if (role === "member") throw new Error("Unauthorized");
            }
          }
        });

        return plan();
      },
    [context, sideEffect, propName, scope],
  );

/**
 * Authorization plugin for workspaces.
 *
 * - Create: Any authenticated user
 * - Update: Admin+ role required
 * - Delete: Owner only
 */
const WorkspacePlugin = wrapPlans({
  Mutation: {
    createWorkspace: validatePermissions("workspace", "create"),
    updateWorkspace: validatePermissions("rowId", "update"),
    deleteWorkspace: validatePermissions("rowId", "delete"),
  },
});

export default WorkspacePlugin;
