import { EXPORTABLE } from "graphile-export";
import { context, sideEffect } from "postgraphile/grafast";
import { wrapPlans } from "postgraphile/utils";

import type { PlanWrapperFn } from "postgraphile/utils";
import type { MutationScope } from "./types";

/**
 * Validates user permissions.
 *
 * Users can only modify themselves (self-only operations).
 * - Create: Blocked (users are created via OAuth flow)
 * - Update: Self-only
 * - Delete: Self-only
 */
const validatePermissions = (propName: string, scope: MutationScope) =>
  EXPORTABLE(
    (context, sideEffect, propName, scope): PlanWrapperFn =>
      (plan, _, fieldArgs) => {
        const $input = fieldArgs.getRaw(["input", propName]);
        const $observer = context().get("observer");

        sideEffect([$input, $observer], async ([input, observer]) => {
          if (!observer) throw new Error("Unauthorized");

          // Users cannot be created via GraphQL - they are created via OAuth
          if (scope === "create") {
            throw new Error("Unauthorized");
          }

          // Users can only update/delete themselves
          if (scope === "update" || scope === "delete") {
            if (input !== observer.id) {
              throw new Error("Unauthorized");
            }
          }
        });

        return plan();
      },
    [context, sideEffect, propName, scope],
  );

/**
 * Authorization plugin for users.
 *
 * Enforces self-only access: users can only modify their own profile.
 */
const UserPlugin = wrapPlans({
  Mutation: {
    createUser: validatePermissions("user", "create"),
    updateUser: validatePermissions("rowId", "update"),
    deleteUser: validatePermissions("rowId", "delete"),
  },
});

export default UserPlugin;
