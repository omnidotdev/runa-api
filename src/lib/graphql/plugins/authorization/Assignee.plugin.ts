import { EXPORTABLE } from "graphile-export";
import { context, sideEffect } from "postgraphile/grafast";
import { wrapPlans } from "postgraphile/utils";

import { isWithinLimit } from "lib/entitlements";
import { FEATURE_KEYS, billingBypassSlugs } from "./constants";

import type { InsertAssignee } from "lib/db/schema";
import type { PlanWrapperFn } from "postgraphile/utils";
import type { MutationScope } from "./types";

/**
 * Validate assignee permissions.
 *
 * - Create: Any workspace member can assign users to tasks (with tier limits)
 * - Update/Delete: Any workspace member can modify/remove assignees
 */
const validatePermissions = (propName: string, scope: MutationScope) =>
  EXPORTABLE(
    (
      context,
      sideEffect,
      isWithinLimit,
      FEATURE_KEYS,
      billingBypassSlugs,
      propName,
      scope,
    ): PlanWrapperFn =>
      (plan, _, fieldArgs) => {
        const $input = fieldArgs.getRaw(["input", propName]);
        const $observer = context().get("observer");
        const $db = context().get("db");

        sideEffect([$input, $observer, $db], async ([input, observer, db]) => {
          if (!observer) throw new Error("Unauthorized");

          if (scope !== "create") {
            // For update/delete, verify workspace membership
            // input is { taskId, userId } for composite key tables
            const { taskId, userId } = input as {
              taskId: string;
              userId: string;
            };
            const assignee = await db.query.assigneeTable.findFirst({
              where: (table, { and, eq }) =>
                and(eq(table.taskId, taskId), eq(table.userId, userId)),
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

            // Any workspace member can modify/remove assignees
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

            // Check limit via entitlements service
            const withinLimit = await isWithinLimit(
              task.project.workspace,
              FEATURE_KEYS.MAX_ASSIGNEES,
              task.assignees.length,
              billingBypassSlugs,
            );

            if (!withinLimit)
              throw new Error("Maximum number of assignees reached");
          }
        });

        return plan();
      },
    [
      context,
      sideEffect,
      isWithinLimit,
      FEATURE_KEYS,
      billingBypassSlugs,
      propName,
      scope,
    ],
  );

/**
 * Authorization plugin for assignees.
 */
const AssigneePlugin = wrapPlans({
  Mutation: {
    createAssignee: validatePermissions("assignee", "create"),
    updateAssignee: validatePermissions("rowId", "update"),
    deleteAssignee: validatePermissions("rowId", "delete"),
  },
});

export default AssigneePlugin;
