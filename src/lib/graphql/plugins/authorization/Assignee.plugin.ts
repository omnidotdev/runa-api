import { EXPORTABLE } from "graphile-export";
import { context, sideEffect } from "postgraphile/grafast";
import { makeWrapPlansPlugin } from "postgraphile/utils";

import type { InsertAssignee } from "lib/db/schema";
import type { GraphQLContext } from "lib/graphql/createGraphqlContext";
import type { ExecutableStep, FieldArgs } from "postgraphile/grafast";
import type { MutationScope } from "./types";

const validatePermissions = (propName: string, scope: MutationScope) =>
  EXPORTABLE(
    (context, sideEffect, propName, scope) =>
      // biome-ignore lint: no exported plan type
      (plan: any, _: ExecutableStep, fieldArgs: FieldArgs) => {
        const $input = fieldArgs.getRaw(["input", propName]);
        const $observer = context<GraphQLContext>().get("observer");
        const $db = context<GraphQLContext>().get("db");

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

            // TODO: determine proper permissions
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

            // TODO: extra permissions to assign to tasks?
          }
        });

        return plan();
      },
    [context, sideEffect, propName, scope],
  );

export default makeWrapPlansPlugin({
  Mutation: {
    createAssignee: validatePermissions("assignee", "create"),
    updateAssignee: validatePermissions("rowId", "update"),
    deleteAssignee: validatePermissions("rowId", "delete"),
  },
});
