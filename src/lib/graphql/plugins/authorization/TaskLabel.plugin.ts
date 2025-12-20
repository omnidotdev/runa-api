import { EXPORTABLE } from "graphile-export";
import { context, sideEffect } from "postgraphile/grafast";
import { wrapPlans } from "postgraphile/utils";

import type { InsertTaskLabel } from "lib/db/schema";
import type { PlanWrapperFn } from "postgraphile/utils";
import type { MutationScope } from "./types";

/**
 * Validate task label permissions.
 *
 * Task labels require workspace membership.
 * - Create: Any workspace member can add labels to tasks
 * - Update/Delete: Task author OR admin+ can modify labels
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
            // For create, get the task and verify workspace membership
            const taskId = (input as InsertTaskLabel).taskId;

            const task = await db.query.taskTable.findFirst({
              where: (table, { eq }) => eq(table.id, taskId),
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
            });

            if (!task?.project.workspace.workspaceUsers.length) {
              throw new Error("Unauthorized");
            }
          } else {
            // For update/delete, get the task label and verify membership + author/admin
            const taskLabel = await db.query.taskLabelTable.findFirst({
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

            if (!taskLabel?.task.project.workspace.workspaceUsers.length) {
              throw new Error("Unauthorized");
            }

            const role =
              taskLabel.task.project.workspace.workspaceUsers[0].role;

            // Task author or admin+ can modify labels
            if (taskLabel.task.authorId !== observer.id && role === "member") {
              throw new Error("Unauthorized");
            }
          }
        });

        return plan();
      },
    [context, sideEffect, propName, scope],
  );

/**
 * Authorization plugin for task labels.
 *
 * Enforces workspace membership. Update/delete requires task author or admin+ role.
 */
const TaskLabelPlugin = wrapPlans({
  Mutation: {
    createTaskLabel: validatePermissions("taskLabel", "create"),
    updateTaskLabel: validatePermissions("rowId", "update"),
    deleteTaskLabel: validatePermissions("rowId", "delete"),
  },
});

export default TaskLabelPlugin;
