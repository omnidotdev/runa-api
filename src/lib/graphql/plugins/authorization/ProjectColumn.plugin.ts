import { EXPORTABLE } from "graphile-export";
import { context, sideEffect } from "postgraphile/grafast";
import { wrapPlans } from "postgraphile/utils";

import type { InsertProjectColumn } from "lib/db/schema";
import type { PlanWrapperFn } from "postgraphile/utils";
import type { MutationScope } from "./types";

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
            const projectColumn = await db.query.projectColumnTable.findFirst({
              where: (table, { eq }) => eq(table.id, input),
              with: {
                workspace: {
                  with: {
                    workspaceUsers: {
                      where: (table, { eq }) => eq(table.userId, observer.id),
                    },
                  },
                },
              },
            });

            if (!projectColumn?.workspace.workspaceUsers.length)
              throw new Error("Unauthorized");

            // TODO: determine permissions
            if (projectColumn.workspace.workspaceUsers[0].role !== "owner")
              throw new Error("Unauthorized");
          } else {
            const workspaceId = (input as InsertProjectColumn).workspaceId;

            const workspace = await db.query.workspaceTable.findFirst({
              where: (table, { eq }) => eq(table.id, workspaceId),
              with: {
                workspaceUsers: {
                  where: (table, { eq }) => eq(table.userId, observer.id),
                },
              },
            });

            if (!workspace?.workspaceUsers.length)
              throw new Error("Unauthorized");

            // TODO: determine proper permissions
            if (workspace.workspaceUsers[0].role !== "owner")
              throw new Error("Unauthorized");
          }
        });

        return plan();
      },
    [context, sideEffect, propName, scope],
  );

export default wrapPlans({
  Mutation: {
    createProjectColumn: validatePermissions("projectColumn", "create"),
    updateProjectColumn: validatePermissions("rowId", "update"),
    deleteProjectColumn: validatePermissions("rowId", "delete"),
  },
});
