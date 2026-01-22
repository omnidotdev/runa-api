import { EXPORTABLE } from "graphile-export";
import { context, sideEffect } from "postgraphile/grafast";
import { wrapPlans } from "postgraphile/utils";

import { checkPermission } from "lib/authz";

import type { InsertEmoji } from "lib/db/schema";
import type { PlanWrapperFn } from "postgraphile/utils";
import type { MutationScope } from "./types";

/**
 * Validate emoji (reaction) permissions via PDP.
 *
 * - Create: Member permission on project required
 * - Update: Member permission on project required
 * - Delete: Member permission on project required
 */
const validatePermissions = (propName: string, scope: MutationScope) =>
  EXPORTABLE(
    (context, sideEffect, checkPermission, propName, scope): PlanWrapperFn =>
      (plan, _, fieldArgs) => {
        const $input = fieldArgs.getRaw(["input", propName]);
        const $observer = context().get("observer");
        const $db = context().get("db");

        const $authzCache = context().get("authzCache");

        sideEffect(
          [$input, $observer, $db, $authzCache],
          async ([input, observer, db, authzCache]) => {
            if (!observer) throw new Error("Unauthorized");

            if (scope === "create") {
              const postId = (input as InsertEmoji).postId;

              // Get post to find project for AuthZ check
              const post = await db.query.posts.findFirst({
                where: (table, { eq }) => eq(table.id, postId),
                with: { task: { columns: { projectId: true } } },
              });
              if (!post) throw new Error("Post not found");

              const allowed = await checkPermission(
                observer.id,
                "project",
                post.task.projectId,
                "member",
                authzCache,
              );
              if (!allowed) throw new Error("Unauthorized");
            } else {
              // Get emoji to find project for AuthZ check
              const emoji = await db.query.emojis.findFirst({
                where: (table, { eq }) => eq(table.id, input),
                with: {
                  post: { with: { task: { columns: { projectId: true } } } },
                },
              });
              if (!emoji) throw new Error("Emoji not found");

              const allowed = await checkPermission(
                observer.id,
                "project",
                emoji.post.task.projectId,
                "member",
                authzCache,
              );
              if (!allowed) throw new Error("Unauthorized");
            }
          },
        );

        return plan();
      },
    [context, sideEffect, checkPermission, propName, scope],
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
