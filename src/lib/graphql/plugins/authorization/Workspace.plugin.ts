import { EXPORTABLE } from "graphile-export";
import type { GraphQLContext } from "lib/graphql/createGraphqlContext";
import { polar } from "lib/polar/sdk";
import { context, sideEffect } from "postgraphile/grafast";
import type { ExecutableStep, FieldArgs } from "postgraphile/grafast";
import { makeWrapPlansPlugin } from "postgraphile/utils";
import type { MutationScope } from "./types";

const validatePermissions = (propName: string, scope: MutationScope) =>
  EXPORTABLE(
    (context, sideEffect, polar, propName, scope) =>
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

            // TODO: figure out best way to make subscriptionId not nullable, *or* update logic to possibly throw if subId is null
            if (scope === "delete" && !!workspace.subscriptionId) {
              await polar.subscriptions.revoke({
                id: workspace.subscriptionId,
              });

              // TODO: determine how to handle errors from above.
            }
          }
        });

        return plan();
      },
    [context, sideEffect, polar, propName, scope],
  );

export default makeWrapPlansPlugin({
  Mutation: {
    createWorkspace: validatePermissions("workspace", "create"),
    updateWorkspace: validatePermissions("rowId", "update"),
    deleteWorkspace: validatePermissions("rowId", "delete"),
  },
});
