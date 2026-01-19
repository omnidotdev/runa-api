import { EXPORTABLE } from "graphile-export";
import { context, sideEffect } from "postgraphile/grafast";
import { wrapPlans } from "postgraphile/utils";

import { AUTHZ_ENABLED, AUTHZ_API_URL, checkPermission } from "lib/authz";

import type { InsertPost } from "lib/db/schema";
import type { PlanWrapperFn } from "postgraphile/utils";
import type { MutationScope } from "./types";

/**
 * Validate post (comment) permissions via PDP.
 *
 * - Create: Member permission on project required
 * - Update: Member permission on project required
 * - Delete: Member permission on project required
 */
const validatePermissions = (propName: string, scope: MutationScope) =>
  EXPORTABLE(
    (
      context,
      sideEffect,
      AUTHZ_ENABLED,
      AUTHZ_API_URL,
      checkPermission,
      propName,
      scope,
    ): PlanWrapperFn =>
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
              const taskId = (input as InsertPost).taskId;

              // Get task to find project for AuthZ check
              const task = await db.query.tasks.findFirst({
                where: (table, { eq }) => eq(table.id, taskId),
                columns: { projectId: true },
              });
              if (!task) throw new Error("Task not found");

              const allowed = await checkPermission(
                AUTHZ_ENABLED,
                AUTHZ_API_URL,
                observer.id,
                "project",
                task.projectId,
                "member",
                authzCache,
              );
              if (!allowed) throw new Error("Unauthorized");
            } else {
              // Get post to find project for AuthZ check
              const post = await db.query.posts.findFirst({
                where: (table, { eq }) => eq(table.id, input),
                with: { task: { columns: { projectId: true } } },
              });
              if (!post) throw new Error("Post not found");

              const allowed = await checkPermission(
                AUTHZ_ENABLED,
                AUTHZ_API_URL,
                observer.id,
                "project",
                post.task.projectId,
                "member",
                authzCache,
              );
              if (!allowed) throw new Error("Unauthorized");
            }
          },
        );

        return plan();
      },
    [
      context,
      sideEffect,
      AUTHZ_ENABLED,
      AUTHZ_API_URL,
      checkPermission,
      propName,
      scope,
    ],
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
