import { EXPORTABLE } from "graphile-export";
import { context, sideEffect } from "postgraphile/grafast";
import { makeWrapPlansPlugin } from "postgraphile/utils";

import type { MutationScope } from "./types";

import type { GraphQLContext } from "lib/graphql/createGraphqlContext";
import type { ExecutableStep, FieldArgs } from "postgraphile/grafast";

const validatePermissions = (propName: string, scope: MutationScope) =>
  EXPORTABLE(
    (context, sideEffect, propName, scope) =>
      // biome-ignore lint: no exported plan type
      (plan: any, _: ExecutableStep, fieldArgs: FieldArgs) => {
        const $input = fieldArgs.getRaw(["input", propName]);
        const $observer = context<GraphQLContext>().get("observer");

        return plan();
      },
    [context, sideEffect, propName, scope],
  );

export default makeWrapPlansPlugin({
  Mutation: {
    createProjectColumn: validatePermissions("projectColumn", "create"),
    updateProjectColumn: validatePermissions("rowId", "update"),
    deleteProjectColumn: validatePermissions("rowId", "delete"),
  },
});
