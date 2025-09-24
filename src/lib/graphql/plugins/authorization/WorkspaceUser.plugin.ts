import { EXPORTABLE } from "graphile-export";
import { makeWrapPlansPlugin } from "postgraphile/utils";

import type { MutationScope } from "./types";

import type { ExecutableStep, FieldArgs } from "postgraphile/grafast";

const validatePermissions = (propName: string, scope: MutationScope) =>
  EXPORTABLE(
    (propName, scope) =>
      // biome-ignore lint: no exported plan type
      (plan: any, _: ExecutableStep, fieldArgs: FieldArgs) => {
        return plan();
      },
    [propName, scope],
  );

export default makeWrapPlansPlugin({
  Mutation: {
    createWorkspaceUser: validatePermissions("workspaceUser", "create"),
    updateWorkspaceUser: validatePermissions("rowId", "update"),
    deleteWorkspaceUser: validatePermissions("rowId", "delete"),
  },
});
