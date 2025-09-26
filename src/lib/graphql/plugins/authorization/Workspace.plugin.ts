import { EXPORTABLE } from "graphile-export";
import { context, sideEffect } from "postgraphile/grafast";
import { makeWrapPlansPlugin } from "postgraphile/utils";

import type { InsertWorkspace } from "lib/db/schema";
import type { GraphQLContext } from "lib/graphql/createGraphqlContext";
import { polar } from "lib/polar/sdk";
import type { ExecutableStep, FieldArgs } from "postgraphile/grafast";
import type { MutationScope } from "./types";

// TODO: determine restrictions for updating, inserting, deleting `tier` column. Possibly through tags plugin, see: https://github.com/omnidotdev/backfeed-api/blob/master/postgraphile.tags.json5

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

            // TODO: figure out best way to make subscriptionId not nullable
            if (scope === "delete" && !!workspace.subscriptionId) {
              await polar.subscriptions.revoke({
                id: workspace.subscriptionId,
              });

              // TODO: determine how to handle errors from above.
            }
          } else {
            // This should be fine as a `Free` tier from polar does not require any credit card
            const checkout = await polar.checkouts.create({
              // TODO: conditionalize, this is the sandbox for the the `Free` runa product
              products: ["ab64808c-6616-4265-9de1-1acb606dce2a"],
              externalCustomerId: observer.identityProviderId,
              metadata: {
                // TODO: determine best metadata for workspace. `id` is not available until after create mutation
                workspaceSlug: (input as InsertWorkspace).slug,
              },
            });

            await polar.checkouts.clientConfirm({
              clientSecret: checkout.clientSecret,
              checkoutConfirmStripe: {
                // TODO: conditionalize
                productId: "ab64808c-6616-4265-9de1-1acb606dce2a",
                customerEmail: observer.email,
              },
            });

            // TODO: determine how to handle errors from above.
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
