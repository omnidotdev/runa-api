import { EXPORTABLE } from "graphile-export";
import { context, sideEffect } from "postgraphile/grafast";
import { makeWrapPlansPlugin } from "postgraphile/utils";

import type { GraphQLContext } from "lib/graphql/createGraphqlContext";
import type { ExecutableStep, FieldArgs } from "postgraphile/grafast";
import type { MutationScope } from "./types";

// TODO: determine restrictions for updating, inserting, deleting `tier` column. Possibly through tags plugin, see: https://github.com/omnidotdev/backfeed-api/blob/master/postgraphile.tags.json5

const validatePermissions = (propName: string, scope: MutationScope) =>
  EXPORTABLE(
    (context, sideEffect, propName, scope) =>
      // biome-ignore lint: no exported plan type
      (plan: any, _: ExecutableStep, fieldArgs: FieldArgs) => {
        const $input = fieldArgs.getRaw(["input", propName]);
        const $observer = context<GraphQLContext>().get("observer");
        const $db = context<GraphQLContext>().get("db");

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

            // TODO: determine proper permissions for admins when it comes to updating / deleting workspaces
            if (role !== "owner") throw new Error("Unauthorized");
          } else {
            // TODO: create `free` tier workspace upon creation with user credentials
            // This should be fine as a `Free` tier from polar does not require any credit card
          }
        });

        return plan();
      },
    [context, sideEffect, propName, scope],
  );

export default makeWrapPlansPlugin({
  Mutation: {
    createWorkspace: validatePermissions("workspace", "create"),
    updateWorkspace: validatePermissions("rowId", "update"),
    deleteWorkspace: validatePermissions("rowId", "delete"),
  },
});
