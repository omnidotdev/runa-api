import { EXPORTABLE } from "graphile-export";
import { context, sideEffect } from "postgraphile/grafast";
import { wrapPlans } from "postgraphile/utils";

import type { InsertPost } from "lib/db/schema";
import type { PlanWrapperFn } from "postgraphile/utils";
import type { MutationScope } from "./types";

/**
 * Validate post (comment) permissions.
 *
 * - Create: Any workspace member can create posts
 * - Update: Post author OR admin+ can modify posts
 * - Delete: Post author OR admin+ can delete posts
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
            const taskId = (input as InsertPost).taskId;

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
          } else {
            // for update/delete, verify membership and author/admin+ permission
            const post = await db.query.postTable.findFirst({
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

            if (!post?.task.project.workspace.workspaceUsers.length)
              throw new Error("Unauthorized");

            // author or admin+ can modify/delete posts
            if (
              post.authorId !== observer.id &&
              post.task.project.workspace.workspaceUsers[0].role === "member"
            )
              throw new Error("Unauthorized");
          }
        });

        return plan();
      },
    [context, sideEffect, propName, scope],
  );

/**
 * Authorization plugin for posts (comments).
 *
 * Any member can create posts. Update/delete requires author or admin+ role.
 */
const PostPlugin = wrapPlans({
  Mutation: {
    createPost: validatePermissions("post", "create"),
    updatePost: validatePermissions("rowId", "update"),
    deletePost: validatePermissions("rowId", "delete"),
  },
});

export default PostPlugin;
