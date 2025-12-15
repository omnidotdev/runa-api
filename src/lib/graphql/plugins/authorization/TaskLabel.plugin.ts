import { EXPORTABLE } from "graphile-export";
import { context, sideEffect } from "postgraphile/grafast";
import { wrapPlans } from "postgraphile/utils";

import type { PlanWrapperFn } from "postgraphile/utils";
import type { MutationScope } from "./types";

// TODO: discuss permissions
const validatePermissions = (propName: string, scope: MutationScope) =>
  EXPORTABLE(
    (context, sideEffect, propName, scope): PlanWrapperFn =>
      (plan, _, fieldArgs) => {
        const $input = fieldArgs.getRaw(["input", propName]);
        const $observer = context().get("observer");
        const $db = context().get("db");

        sideEffect([$input, $observer, $db], async ([input, observer, db]) => {
          if (!observer) throw new Error("Unauthorized");

          // TODO: tier based permissions
        });

        return plan();
      },
    [context, sideEffect, propName, scope],
  );

export default wrapPlans({
  Mutation: {
    createTaskLabel: validatePermissions("taskLabel", "create"),
    updateTaskLabel: validatePermissions("rowId", "update"),
    deleteTaskLabel: validatePermissions("rowId", "delete"),
  },
});
