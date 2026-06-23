import { EXPORTABLE } from "graphile-export";
import { sideEffect } from "postgraphile/grafast";
import { wrapPlans } from "postgraphile/utils";

import { moderateText } from "lib/moderation";

import type { PlanWrapperFn } from "postgraphile/utils";

/**
 * Moderate user-authored text before a mutation persists it.
 *
 * Mirrors the Backfeed pattern: the text is checked against Say Less (via
 * `moderateText`, which is a fail-open noop when `SAY_LESS_URL` is unset) and a
 * flagged result rejects the mutation. The check runs as a pre-`plan()` side
 * effect so a flag aborts the write.
 *
 * `inputField` is the wrapper field that holds the row on this specific
 * mutation: create mutations nest it under `input.<entity>` (e.g. `task` ->
 * `input.task`), update mutations expose the changed columns under
 * `input.patch`. It must name a field that exists on the mutation's input type:
 * grafast's `getRaw` throws on an unknown attribute, so probing a missing path
 * (e.g. `patch` on a create input) aborts the mutation before moderation runs.
 * `fields` lists the text columns to screen.
 */
const moderateFields = (inputField: string, fields: string[]): PlanWrapperFn =>
  EXPORTABLE(
    (sideEffect, moderateText, inputField, fields): PlanWrapperFn =>
      (plan, _, fieldArgs) => {
        const $source = fieldArgs.getRaw(["input", inputField]);

        sideEffect([$source], async ([source]) => {
          const row = source as Record<string, unknown> | null | undefined;
          if (!row) return;

          for (const field of fields) {
            const value = row[field];
            if (typeof value !== "string" || !value) continue;

            const { flagged } = await moderateText(value);
            if (flagged) throw new Error("content flagged by moderation");
          }
        });

        return plan();
      },
    [sideEffect, moderateText, inputField, fields],
  );

/**
 * Content moderation plugin.
 *
 * Screens the primary user-authored text surfaces (task content/description,
 * post title/description, project description, column title) on create and
 * update. Fully noop when `SAY_LESS_URL` is unset.
 */
const ContentModerationPlugin = wrapPlans({
  Mutation: {
    createTask: moderateFields("task", ["content", "description"]),
    updateTask: moderateFields("patch", ["content", "description"]),
    createPost: moderateFields("post", ["title", "description"]),
    updatePost: moderateFields("patch", ["title", "description"]),
    createProject: moderateFields("project", ["description"]),
    updateProject: moderateFields("patch", ["description"]),
    createColumn: moderateFields("column", ["title"]),
    updateColumn: moderateFields("patch", ["title"]),
  },
});

export default ContentModerationPlugin;
