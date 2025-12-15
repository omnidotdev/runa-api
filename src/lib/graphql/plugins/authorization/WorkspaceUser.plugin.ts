import { EXPORTABLE } from "graphile-export";
import { context, sideEffect } from "postgraphile/grafast";
import { wrapPlans } from "postgraphile/utils";

import { BASIC_TIER_MAX_MEMBERS, FREE_TIER_MAX_MEMBERS } from "./constants";

import type { InsertWorkspaceUser } from "lib/db/schema";
import type { PlanWrapperFn } from "postgraphile/utils";
import type { MutationScope } from "./types";

// TODO: discuss permissions
const validatePermissions = (propName: string, scope: MutationScope) =>
  EXPORTABLE(
    (
      context,
      sideEffect,
      propName,
      scope,
      FREE_TIER_MAX_MEMBERS,
      BASIC_TIER_MAX_MEMBERS,
    ): PlanWrapperFn =>
      (plan, _, fieldArgs) => {
        const $input = fieldArgs.getRaw(["input", propName]);
        const $observer = context().get("observer");
        const $db = context().get("db");

        sideEffect([$input, $observer, $db], async ([input, observer, db]) => {
          if (!observer) throw new Error("Unauthorized");

          if (scope === "create") {
            const workspaceId = (input as InsertWorkspaceUser).workspaceId;

            const workspace = await db.query.workspaceTable.findFirst({
              where: (table, { eq }) => eq(table.id, workspaceId),
              with: {
                workspaceUsers: true,
              },
            });

            if (!workspace) throw new Error("Unauthorized");

            // TODO: restrict create and update scopes for `admin`:
            // - Free tier: 1 admin (owner)
            // - Basic tier: 3 admin (owner + 2 others)

            if (
              workspace.tier === "free" &&
              workspace.workspaceUsers.length >= FREE_TIER_MAX_MEMBERS
            )
              throw new Error("Maximum number of members reached");

            if (
              workspace.tier === "basic" &&
              workspace.workspaceUsers.length >= BASIC_TIER_MAX_MEMBERS
            )
              throw new Error("Maximum number of members reached");
          }
        });

        return plan();
      },
    [
      context,
      sideEffect,
      propName,
      scope,
      FREE_TIER_MAX_MEMBERS,
      BASIC_TIER_MAX_MEMBERS,
    ],
  );

export default wrapPlans({
  Mutation: {
    createWorkspaceUser: validatePermissions("workspaceUser", "create"),
    updateWorkspaceUser: validatePermissions("rowId", "update"),
    deleteWorkspaceUser: validatePermissions("rowId", "delete"),
  },
});
