/**
 * PostMention Plugin
 *
 * Hooks into the `createPost` GraphQL mutation to detect @agent / @runa
 * mentions in comment text. When a mention is detected, fires the agent
 * trigger handler asynchronously (fire-and-forget) so the comment creation
 * response is not delayed.
 *
 * Uses the same Grafast sideEffect pattern as PostPlugin and AuthzSyncPlugin.
 */

import { EXPORTABLE } from "graphile-export";
import { context, sideEffect } from "postgraphile/grafast";
import { wrapPlans } from "postgraphile/utils";

import { detectMention, handleMention } from "lib/ai/triggers/mention";

import type { InsertPost } from "lib/db/schema";
import type { PlanWrapperFn } from "postgraphile/utils";

/**
 * Side-effect wrapper for createPost that detects @agent mentions.
 *
 * Extracts the comment description and authenticated user from the
 * mutation context, checks for mention patterns, and triggers the
 * agent handler in the background.
 */
const mentionDetector = (): PlanWrapperFn =>
  EXPORTABLE(
    (context, sideEffect, detectMention, handleMention): PlanWrapperFn =>
      (plan, _, fieldArgs) => {
        const $input = fieldArgs.getRaw(["input", "post"]);
        const $observer = context().get("observer");
        const $accessToken = context().get("accessToken");

        sideEffect(
          [$input, $observer, $accessToken],
          async ([input, observer, accessToken]) => {
            // Skip if unauthenticated or missing data
            if (!observer || !accessToken) return;

            const postInput = input as InsertPost;
            if (!postInput?.description || !postInput?.taskId) return;

            // Guard: skip agent-authored comments (authorId null/undefined)
            // to prevent recursive mention loops. The agent posts replies via
            // direct DB insert, but this guard is defense-in-depth in case
            // the reply path ever changes to go through GraphQL.
            if (postInput.authorId === null || postInput.authorId === undefined)
              return;

            // Check for @agent / @runa mention
            const { hasMention } = detectMention(postInput.description);
            if (!hasMention) return;

            // Fire-and-forget: trigger the agent in the background.
            // Errors are caught here so the sideEffect never throws
            // and the comment creation response is never blocked.
            handleMention({
              taskId: postInput.taskId,
              userId: observer.id,
              accessToken,
              commentText: postInput.description,
            }).catch((err) => {
              console.error(
                "[AI Mention] Failed to handle mention:",
                err instanceof Error ? err.message : String(err),
              );
            });
          },
        );

        return plan();
      },
    [context, sideEffect, detectMention, handleMention],
  );

/**
 * PostMention Plugin — detects @agent mentions in new comments.
 *
 * Registered in graphile.config.ts alongside the authorization plugins.
 */
const PostMentionPlugin = wrapPlans({
  Mutation: {
    createPost: mentionDetector(),
  },
});

export default PostMentionPlugin;
