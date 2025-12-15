import { EXPORTABLE } from "graphile-export";
import { context, sideEffect } from "postgraphile/grafast";
import { wrapPlans } from "postgraphile/utils";

import { BASIC_TIER_MAX_ASSIGNEES, FREE_TIER_MAX_ASSIGNEES } from "./constants";

import type { InsertAssignee } from "lib/db/schema";
import type { PlanWrapperFn } from "postgraphile/utils";
import type { MutationScope } from "./types";

const validatePermissions = (propName: string, scope: MutationScope) =>
  EXPORTABLE(
    (
      context,
      sideEffect,
      propName,
      scope,
      FREE_TIER_MAX_ASSIGNEES,
      BASIC_TIER_MAX_ASSIGNEES,
    ): PlanWrapperFn =>
      (plan, _, fieldArgs) => {
        const $input = fieldArgs.getRaw(["input", propName]);
        const $observer = context().get("observer");
        const $db = context().get("db");

        sideEffect([$input, $observer, $db], async ([input, observer, db]) => {
          if (!observer) throw new Error("Unauthorized");

          if (scope !== "create") {
            const assignee = await db.query.assigneeTable.findFirst({
              where: (table, { eq }) => eq(table.id, input),
              with: {
                task: {
                  with: {
                    project: {
                      with: {
                        workspace: {
                          with: {
                            workspaceUsers: {
                              where: (table, { eq }) =>
                                eq(table.userId, observer.id),
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            });

            if (!assignee?.task.project.workspace.workspaceUsers.length)
              throw new Error("Unauthorized");

            if (
              assignee.task.project.workspace.workspaceUsers[0].role ===
              "member"
            )
              throw new Error("Unauthorized");
          } else {
            const taskId = (input as InsertAssignee).taskId;

            const task = await db.query.taskTable.findFirst({
              where: (table, { eq }) => eq(table.id, taskId),
              with: {
                assignees: true,
                project: {
                  with: {
                    workspace: {
                      with: {
                        workspaceUsers: {
                          where: (table, { eq }) =>
                            eq(table.userId, observer.id),
                        },
                      },
                    },
                  },
                },
              },
            });

            if (!task?.project.workspace.workspaceUsers.length)
              throw new Error("Unauthorized");

            const tier = task?.project?.workspace.tier;

            if (
              tier === "free" &&
              task.assignees.length >= FREE_TIER_MAX_ASSIGNEES
            )
              throw new Error("Maximum number of assignees reached");

            if (
              tier === "basic" &&
              task.assignees.length >= BASIC_TIER_MAX_ASSIGNEES
            )
              throw new Error("Maximum number of assigness reached");
          }
        });

        return plan();
      },
    [
      context,
      sideEffect,
      propName,
      scope,
      FREE_TIER_MAX_ASSIGNEES,
      BASIC_TIER_MAX_ASSIGNEES,
    ],
  );

export default wrapPlans({
  Mutation: {
    createAssignee: validatePermissions("assignee", "create"),
    updateAssignee: validatePermissions("rowId", "update"),
    deleteAssignee: validatePermissions("rowId", "delete"),
  },
});
