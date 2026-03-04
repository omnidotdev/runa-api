import { EXPORTABLE } from "graphile-export";
import { context, sideEffect } from "postgraphile/grafast";
import { wrapPlans } from "postgraphile/utils";

import {
  deleteCommentFromIndex,
  indexComment,
  isSearchEnabled,
} from "lib/search";

import type { Step } from "postgraphile/grafast";
import type { PlanWrapperFn } from "postgraphile/utils";

/**
 * Index comment (post) after successful creation.
 */
const indexOnCreate = (): PlanWrapperFn =>
  EXPORTABLE(
    (context, sideEffect, indexComment, isSearchEnabled): PlanWrapperFn =>
      (plan, $record) => {
        if (!isSearchEnabled) return plan();

        const $db = context().get("db");

        sideEffect([$record, $db], async ([record, db]) => {
          if (!record?.id) return;

          // Traverse post -> task -> project to get organizationId
          const post = await db.query.posts.findFirst({
            // biome-ignore lint/suspicious/noExplicitAny: drizzle callback types
            where: (table: any, { eq }: any) => eq(table.id, record.id),
            with: {
              task: {
                with: { project: true },
              },
            },
          });

          if (post?.task?.project) {
            await indexComment(post, post.task.project.organizationId);
          }
        });

        return plan();
      },
    [context, sideEffect, indexComment, isSearchEnabled],
  );

/**
 * Re-index comment (post) after update.
 */
const indexOnUpdate = (): PlanWrapperFn =>
  EXPORTABLE(
    (context, sideEffect, indexComment, isSearchEnabled): PlanWrapperFn =>
      (plan, $record) => {
        if (!isSearchEnabled) return plan();

        const $db = context().get("db");

        sideEffect([$record, $db], async ([record, db]) => {
          if (!record?.id) return;

          const post = await db.query.posts.findFirst({
            // biome-ignore lint/suspicious/noExplicitAny: drizzle callback types
            where: (table: any, { eq }: any) => eq(table.id, record.id),
            with: {
              task: {
                with: { project: true },
              },
            },
          });

          if (post?.task?.project) {
            await indexComment(post, post.task.project.organizationId);
          }
        });

        return plan();
      },
    [context, sideEffect, indexComment, isSearchEnabled],
  );

/**
 * Remove comment from index on delete.
 */
const removeOnDelete = (): PlanWrapperFn =>
  EXPORTABLE(
    (
      _context,
      sideEffect,
      deleteCommentFromIndex,
      isSearchEnabled,
    ): PlanWrapperFn =>
      (plan, _, fieldArgs) => {
        if (!isSearchEnabled) return plan();

        const $input = fieldArgs.getRaw([
          "input",
          "rowId",
        ]) as unknown as Step<string>;

        sideEffect([$input], async ([postId]) => {
          if (postId) {
            await deleteCommentFromIndex(postId);
          }
        });

        return plan();
      },
    [context, sideEffect, deleteCommentFromIndex, isSearchEnabled],
  );

/**
 * Search indexing plugin for posts (comments).
 * Indexes comments in Meilisearch after create/update mutations.
 * Removes comments from index on delete.
 */
const PostSearchPlugin = wrapPlans({
  Mutation: {
    createPost: indexOnCreate(),
    updatePost: indexOnUpdate(),
    deletePost: removeOnDelete(),
  },
});

export default PostSearchPlugin;
