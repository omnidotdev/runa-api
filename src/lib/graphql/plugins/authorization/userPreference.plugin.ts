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
        });

        return plan();
      },
    [context, sideEffect, propName, scope],
  );

export default wrapPlans({
  Mutation: {
    createUserPreference: validatePermissions("userPreference", "create"),
    updateUserPreference: validatePermissions("rowId", "update"),
    deleteUserPreference: validatePermissions("rowId", "delete"),
  },
});
