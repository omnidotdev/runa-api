import { EXPORTABLE } from "graphile-export";
import { context, sideEffect } from "postgraphile/grafast";
import { wrapPlans } from "postgraphile/utils";

import {
  BASIC_TIER_MAX_ADMINS,
  BASIC_TIER_MAX_MEMBERS,
  FREE_TIER_MAX_ADMINS,
  FREE_TIER_MAX_MEMBERS,
} from "./constants";

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
      FREE_TIER_MAX_ADMINS,
      BASIC_TIER_MAX_MEMBERS,
      BASIC_TIER_MAX_ADMINS,
    ): PlanWrapperFn =>
      (plan, _, fieldArgs) => {
        const $input = fieldArgs.getRaw(["input", propName]);
        const $observer = context().get("observer");
        const $db = context().get("db");

        sideEffect([$input, $observer, $db], async ([input, observer, db]) => {
          if (!observer) throw new Error("Unauthorized");

          if (scope === "create") {
            const workspaceId = (input as InsertWorkspaceUser).workspaceId;
            const role = (input as InsertWorkspaceUser).role;

            const workspace = await db.query.workspaceTable.findFirst({
              where: (table, { eq }) => eq(table.id, workspaceId),
              with: {
                workspaceUsers: true,
              },
            });

            if (!workspace) throw new Error("Unauthorized");

            if (workspace.tier === "free") {
              if (workspace.workspaceUsers.length >= FREE_TIER_MAX_MEMBERS)
                throw new Error("Maximum number of members reached");

              const numberOfAdmins = workspace.workspaceUsers.filter(
                (member) => member.role !== "member",
              ).length;

              if (role) {
                if (numberOfAdmins >= FREE_TIER_MAX_ADMINS && role !== "member")
                  throw new Error("Maximum number of admins reached");
              }
            }

            if (workspace.tier === "basic") {
              if (workspace.workspaceUsers.length >= BASIC_TIER_MAX_MEMBERS)
                throw new Error("Maximum number of members reached");

              const numberOfAdmins = workspace.workspaceUsers.filter(
                (member) => member.role !== "member",
              ).length;

              if (role) {
                if (
                  numberOfAdmins >= BASIC_TIER_MAX_ADMINS &&
                  role !== "member"
                )
                  throw new Error("Maximum number of admins reached");
              }
            }
          } else {
            const member = await db.query.workspaceUserTable.findFirst({
              where: (table, { eq }) => eq(table.userId, observer.id),
              with: {
                workspace: {
                  with: {
                    workspaceUsers: true,
                  },
                },
              },
            });

            if (!member) throw new Error("Unauthorized");

            if (scope === "update") {
              const role = (input as InsertWorkspaceUser).role;

              if (role) {
                const numberOfAdmins = member.workspace.workspaceUsers.filter(
                  (member) => member.role !== "member",
                ).length;

                if (
                  member.workspace.tier === "free" &&
                  numberOfAdmins >= FREE_TIER_MAX_ADMINS
                )
                  throw new Error("Maximum number of admins reached");

                if (
                  member.workspace.tier === "basic" &&
                  numberOfAdmins >= BASIC_TIER_MAX_ADMINS
                )
                  throw new Error("Maximum number of admins reached");
              }
            }
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
      FREE_TIER_MAX_ADMINS,
      BASIC_TIER_MAX_MEMBERS,
      BASIC_TIER_MAX_ADMINS,
    ],
  );

export default wrapPlans({
  Mutation: {
    createWorkspaceUser: validatePermissions("workspaceUser", "create"),
    updateWorkspaceUser: validatePermissions("patch", "update"),
    deleteWorkspaceUser: validatePermissions("patch", "delete"),
  },
});
