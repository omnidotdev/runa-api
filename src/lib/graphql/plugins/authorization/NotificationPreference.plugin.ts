import { EXPORTABLE } from "graphile-export";
import { context, sideEffect } from "postgraphile/grafast";
import { wrapPlans } from "postgraphile/utils";

import type { InsertNotificationPreference } from "lib/db/schema";
import type { PlanWrapperFn } from "postgraphile/utils";
import type { MutationScope } from "./types";

/**
 * Validate notification preference permissions.
 *
 * Users can only manage their own preferences (self-only operations).
 * - Create: Self-only (userId must match observer)
 * - Update: Self-only (must own the preference)
 * - Delete: Self-only (must own the preference)
 */
const validatePermissions = (propName: string, scope: MutationScope) =>
  EXPORTABLE(
    (context, sideEffect, propName, scope): PlanWrapperFn =>
      (plan, _, fieldArgs) => {
        const $input = fieldArgs.getRaw(["input", propName]);
        const $observer = context().get("observer");
        const $db = context().get("db");

        sideEffect([$input, $observer, $db], async ([input, observer, db]) => {
          if (!observer) throw new Error("Unauthorized");

          if (scope === "create") {
            // For create, verify the userId in the input matches the observer
            const userId = (input as InsertNotificationPreference).userId;
            if (userId !== observer.id) {
              throw new Error("Unauthorized");
            }
          } else {
            // For update/delete, verify the preference belongs to the observer
            const preference = await db.query.notificationPreferences.findFirst(
              {
                where: (table, { eq }) => eq(table.id, input),
              },
            );

            if (!preference) {
              throw new Error("Not found");
            }

            if (preference.userId !== observer.id) {
              throw new Error("Unauthorized");
            }
          }
        });

        return plan();
      },
    [context, sideEffect, propName, scope],
  );

/**
 * Authorization plugin for notification preferences.
 *
 * Enforces self-only access: users can only manage their own preferences.
 */
const NotificationPreferencePlugin = wrapPlans({
  Mutation: {
    createNotificationPreference: validatePermissions(
      "notificationPreference",
      "create",
    ),
    updateNotificationPreference: validatePermissions("rowId", "update"),
    deleteNotificationPreference: validatePermissions("rowId", "delete"),
  },
});

export default NotificationPreferencePlugin;
