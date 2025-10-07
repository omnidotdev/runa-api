import { EXPORTABLE } from "graphile-export";
import { context, sideEffect } from "postgraphile/grafast";
import { makeWrapPlansPlugin } from "postgraphile/utils";

import type { InsertEmoji } from "lib/db/schema";
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
            const emoji = await db.query.emojiTable.findFirst({
              where: (table, { eq }) => eq(table.id, input),
              with: {
                post: {
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
                },
              },
            });

            if (!emoji?.post.task.project.workspace.workspaceUsers.length)
              throw new Error("Unauthorized");

            if (
              emoji.userId !== observer.id &&
              emoji.post.task.project.workspace.workspaceUsers[0].role ===
                "member"
            )
              throw new Error("Unauthorized");
          } else {
            const postId = (input as InsertEmoji).postId;

            const post = await db.query.postTable.findFirst({
              where: (table, { eq }) => eq(table.id, postId),
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

            if (!post?.task.project.workspace.workspaceUsers.length)
              throw new Error("Unauthorized");
          }
        });

        return plan();
      },
    [context, sideEffect, propName, scope],
  );

export default makeWrapPlansPlugin({
  Mutation: {
    createEmoji: validatePermissions("emoji", "create"),
    updateEmoji: validatePermissions("rowId", "update"),
    deleteEmoji: validatePermissions("rowId", "delete"),
  },
});
