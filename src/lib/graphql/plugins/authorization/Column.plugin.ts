import { EXPORTABLE } from "graphile-export";
import { context, sideEffect } from "postgraphile/grafast";
import { wrapPlans } from "postgraphile/utils";

import type { InsertColumn } from "lib/db/schema";
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
            const column = await db.query.columnTable.findFirst({
              where: (table, { eq }) => eq(table.id, input),
              with: {
                project: {
                  with: {
                    workspace: {
                      with: {
                        workspaceUsers: {
                          where: (table, { eq }) =>
                            eq(table.userId, observer.id),
                        },
                      },
                    },
                  },
                },
              },
            });
            if (!column?.project.workspace.workspaceUsers.length)
              throw new Error("Unauthorized");

            // TODO: determine proper permissions
            if (column.project.workspace.workspaceUsers[0].role === "member")
              throw new Error("Unauthorized");
          } else {
            const projectId = (input as InsertColumn).projectId;

            const project = await db.query.projectTable.findFirst({
              where: (table, { eq }) => eq(table.id, projectId),
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

            if (!project?.workspace.workspaceUsers.length)
              throw new Error("Unauthorized");

            // TODO: determine proper permissions
            if (project.workspace.workspaceUsers[0].role === "member")
              throw new Error("Unauthorized");
          }
        });

        return plan();
      },
    [context, sideEffect, propName, scope],
  );

export default wrapPlans({
  Mutation: {
    createColumn: validatePermissions("column", "create"),
    updateColumn: validatePermissions("rowId", "update"),
    deleteColumn: validatePermissions("rowId", "delete"),
  },
});
