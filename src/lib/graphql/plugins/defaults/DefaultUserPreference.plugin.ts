/**
 * Default User Preference Plugin
 *
 * Create a user preference record server-side after project creation.
 * This ensures the creating user always has a preference entry (default
 * view mode, hidden columns, etc.) even if the client-side onSuccess
 * callback fails.
 *
 * Uses the observer context to resolve the current user ID.
 */

import { EXPORTABLE } from "graphile-export";
import { context, sideEffect } from "postgraphile/grafast";
import { wrapPlans } from "postgraphile/utils";

import { userPreferences } from "lib/db/schema";

import type { PgInsertSingleStep } from "@dataplan/pg";
import type { ObjectStep } from "postgraphile/grafast";
import type { PlanWrapperFn } from "postgraphile/utils";

/**
 * Create a user preference after project insertion.
 */
const createDefaultUserPreference = (): PlanWrapperFn =>
  EXPORTABLE(
    (context, sideEffect, userPreferences): PlanWrapperFn =>
      (plan) => {
        const $result = plan();
        const $db = context().get("db");
        const $observer = context().get("observer");

        const $objectResult = $result as ObjectStep<{
          result: PgInsertSingleStep;
        }>;
        const $insertStep = $objectResult.getStepForKey("result");
        const $projectId = $insertStep.get("id");

        sideEffect(
          [$projectId, $db, $observer],
          async ([projectId, db, observer]) => {
            if (!projectId || !observer?.id) return;

            await db
              .insert(userPreferences)
              .values({
                userId: observer.id,
                projectId,
              })
              .onConflictDoNothing();
          },
        );

        return $result;
      },
    [context, sideEffect, userPreferences],
  );

/**
 * Plugin that seeds a default user preference on project creation.
 */
const DefaultUserPreferencePlugin = wrapPlans({
  Mutation: {
    createProject: createDefaultUserPreference(),
  },
});

export default DefaultUserPreferencePlugin;
