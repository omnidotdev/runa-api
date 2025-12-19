import { EXPORTABLE } from "graphile-export";
import { context, sideEffect } from "postgraphile/grafast";
import { wrapPlans } from "postgraphile/utils";

import type { InsertEmoji } from "lib/db/schema";
import type { PlanWrapperFn } from "postgraphile/utils";
import type { MutationScope } from "./types";

/**
 * Validates emoji (reaction) permissions.
 *
 * - Create: Any workspace member can add reactions
 * - Update: Emoji owner OR admin+ can modify reactions
 * - Delete: Emoji owner OR admin+ can remove reactions
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
          } else {
            // for update/delete, verify membership and owner/admin+ permission
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

            // emoji owner or admin+ can modify/delete reactions
            if (
              emoji.userId !== observer.id &&
              emoji.post.task.project.workspace.workspaceUsers[0].role ===
                "member"
            )
              throw new Error("Unauthorized");
          }
        });

        return plan();
      },
    [context, sideEffect, propName, scope],
  );

/**
 * Authorization plugin for emojis (reactions).
 *
 * Any member can add reactions. Update/delete requires owner or admin+ role.
 */
const EmojiPlugin = wrapPlans({
  Mutation: {
    createEmoji: validatePermissions("emoji", "create"),
    updateEmoji: validatePermissions("rowId", "update"),
    deleteEmoji: validatePermissions("rowId", "delete"),
  },
});

export default EmojiPlugin;
