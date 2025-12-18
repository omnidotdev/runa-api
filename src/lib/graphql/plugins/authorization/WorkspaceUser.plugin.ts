import { EXPORTABLE } from "graphile-export";
import { context, sideEffect } from "postgraphile/grafast";
import { wrapPlans } from "postgraphile/utils";

import type { PlanWrapperFn } from "postgraphile/utils";
import type { MutationScope } from "./types";

// TODO: discuss permissions
const validatePermissions = (propName: string, scope: MutationScope) =>
  EXPORTABLE(
    (context, sideEffect, propName, _scope): PlanWrapperFn =>
      (plan, _, fieldArgs) => {
        const $input = fieldArgs.getRaw(["input", propName]);
        const $observer = context().get("observer");
        const $db = context().get("db");

        sideEffect(
          [$input, $observer, $db],
          async ([_input, observer, _db]) => {
            if (!observer) throw new Error("Unauthorized");
          },
        );

        return plan();
      },
    [context, sideEffect, propName, scope],
  );

/**
 * Authorization plugin for workspace users.
 */
const WorkspaceUserPlugin = wrapPlans({
  Mutation: {
    createWorkspaceUser: validatePermissions("workspaceUser", "create"),
    updateWorkspaceUser: validatePermissions("rowId", "update"),
    deleteWorkspaceUser: validatePermissions("rowId", "delete"),
  },
});

export default WorkspaceUserPlugin;
