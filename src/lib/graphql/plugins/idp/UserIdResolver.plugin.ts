/**
 * User ID Resolver Plugin
 *
 * Resolves IDP user IDs (identityProviderId) to local user IDs in mutations.
 *
 * The frontend fetches organization members from the IDP and uses IDP user IDs.
 * The database expects local user IDs for foreign key constraints.
 * This plugin bridges that gap by translating IDP IDs to local IDs.
 *
 * Pattern:
 * 1. Frontend sends IDP user ID (from organization members API)
 * 2. This plugin resolves it to local user ID
 * 3. Mutation executes with correct local user ID
 * 4. Foreign key constraint satisfied
 *
 * If the user hasn't authenticated to this app yet, they won't have a local
 * record and the plugin throws a clear error.
 */

import { EXPORTABLE } from "graphile-export";
import { context, sideEffect } from "postgraphile/grafast";
import { wrapPlans } from "postgraphile/utils";

import type { InsertAssignee } from "lib/db/schema";
import type { PlanWrapperFn } from "postgraphile/utils";

/**
 * Resolve IDP user ID to local user ID for createAssignee mutation.
 *
 * The input.assignee.userId from frontend is the IDP user ID (identityProviderId).
 * We look up the local user and replace the ID so the FK constraint works.
 */
const resolveCreateAssigneeUserId = (): PlanWrapperFn =>
  EXPORTABLE(
    (context, sideEffect): PlanWrapperFn =>
      (plan, _, fieldArgs) => {
        const $input = fieldArgs.getRaw(["input", "assignee"]);
        const $db = context().get("db");

        sideEffect([$input, $db], async ([input, db]) => {
          const assigneeInput = input as InsertAssignee;
          const idpUserId = assigneeInput.userId;

          // Look up user by identityProviderId (the IDP user ID)
          const user = await db.query.users.findFirst({
            where: (table, { eq }) => eq(table.identityProviderId, idpUserId),
            columns: { id: true },
          });

          if (!user) {
            throw new Error(
              "Cannot assign this user - they have not signed in to this application yet. " +
                "Users must authenticate at least once before they can be assigned to tasks.",
            );
          }

          // Replace the IDP user ID with the local user ID
          // This modifies the input object that will be used by the mutation
          assigneeInput.userId = user.id;
        });

        return plan();
      },
    [context, sideEffect],
  );

/**
 * Resolve IDP user ID to local user ID for deleteAssignee mutation.
 *
 * For composite key tables (assignee), the userId is at the root level of input.
 *
 * The input userId could be:
 * - IDP user ID (identityProviderId) - from organization members API
 * - Local user ID - from existing assignee records in the database
 *
 * We check both to handle either case.
 */
const resolveDeleteAssigneeUserId = (): PlanWrapperFn =>
  EXPORTABLE(
    (context, sideEffect): PlanWrapperFn =>
      (plan, _, fieldArgs) => {
        // For deleteAssignee, get the raw input object to modify userId
        const $input = fieldArgs.getRaw(["input"]);
        const $db = context().get("db");

        sideEffect([$input, $db], async ([input, db]) => {
          const deleteInput = input as { taskId: string; userId: string };
          const inputUserId = deleteInput.userId;

          // First, check if the userId is already a local user ID
          const userById = await db.query.users.findFirst({
            where: (table, { eq }) => eq(table.id, inputUserId),
            columns: { id: true },
          });

          if (userById) {
            // Already a local user ID, no resolution needed
            return;
          }

          // Try to resolve as IDP user ID (identityProviderId)
          const userByIdp = await db.query.users.findFirst({
            where: (table, { eq }) => eq(table.identityProviderId, inputUserId),
            columns: { id: true },
          });

          if (!userByIdp) {
            throw new Error(
              "Cannot find this user - they may not have signed in to this application yet.",
            );
          }

          // Replace the IDP user ID with the local user ID
          deleteInput.userId = userByIdp.id;
        });

        return plan();
      },
    [context, sideEffect],
  );

/**
 * User ID Resolver Plugin
 *
 * Resolves IDP user IDs to local user IDs for mutations that reference users.
 * This runs BEFORE authorization plugins to ensure the correct user ID is used.
 */
const UserIdResolverPlugin = wrapPlans({
  Mutation: {
    createAssignee: resolveCreateAssigneeUserId(),
    deleteAssignee: resolveDeleteAssigneeUserId(),
  },
});

export default UserIdResolverPlugin;
