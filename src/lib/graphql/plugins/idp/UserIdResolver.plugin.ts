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
 * Members who have never signed in to this app have no local `user` row yet.
 * For assignment we provision a lightweight stub keyed by identityProviderId so
 * any org member is assignable immediately. The stub is enriched with the real
 * name/avatar/email on first login (the auth plugin upserts on the same
 * identityProviderId conflict target). Assignee rendering pulls name/avatar from
 * the IDP member list, not the local row, so an unenriched stub displays fine.
 */

import { EXPORTABLE } from "graphile-export";
import { context, sideEffect } from "postgraphile/grafast";
import { wrapPlans } from "postgraphile/utils";

import { users } from "lib/db/schema";

import type { InsertAssignee } from "lib/db/schema";
import type { PlanWrapperFn } from "postgraphile/utils";

/**
 * Resolve IDP user ID to local user ID for createAssignee mutation.
 *
 * The input.assignee.userId from frontend is the IDP user ID (identityProviderId).
 * We look up the local user and replace the ID so the FK constraint works. If no
 * local row exists yet (member never signed in), we provision a stub keyed by
 * identityProviderId rather than rejecting the assignment.
 */
const resolveCreateAssigneeUserId = (): PlanWrapperFn =>
  EXPORTABLE(
    (context, sideEffect, users): PlanWrapperFn =>
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

          if (user) {
            // Replace the IDP user ID with the local user ID. This modifies the
            // input object that will be used by the mutation.
            assigneeInput.userId = user.id;
            return;
          }

          // Member has no local row yet (never signed in). Provision a stub so
          // the assignment can proceed. Placeholders for the notNull/unique
          // columns are derived from the IDP id (so they never collide) and get
          // overwritten with real profile data when the member first logs in,
          // since the auth plugin upserts on the same identityProviderId target.
          // `onConflictDoNothing` (no target) keeps this safe against a login
          // that races in between the lookup and insert.
          await db
            .insert(users)
            .values({
              identityProviderId: idpUserId,
              name: "Pending member",
              email: `${idpUserId}@users.runa.local`,
            })
            .onConflictDoNothing();

          // Re-read to obtain the local id (either the stub we just created or a
          // row a concurrent login wrote).
          const provisioned = await db.query.users.findFirst({
            where: (table, { eq }) => eq(table.identityProviderId, idpUserId),
            columns: { id: true },
          });

          if (!provisioned) {
            throw new Error(
              "Cannot assign this user - failed to provision a local record. " +
                "Please try again.",
            );
          }

          assigneeInput.userId = provisioned.id;
        });

        return plan();
      },
    [context, sideEffect, users],
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
