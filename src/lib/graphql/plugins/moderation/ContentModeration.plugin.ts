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
 * `entityKey` is the create input wrapper field (e.g. `task` -> `input.task`);
 * update mutations carry the same fields under `input.patch`. `fields` lists the
 * text columns to screen.
 */
const moderateFields = (entityKey: string, fields: string[]): PlanWrapperFn =>
  EXPORTABLE(
    (sideEffect, moderateText, entityKey, fields): PlanWrapperFn =>
      (plan, _, fieldArgs) => {
        // Create mutations nest the row under `input.<entityKey>`; update
        // mutations expose the changed columns under `input.patch`.
        const $entity = fieldArgs.getRaw(["input", entityKey]);
        const $patch = fieldArgs.getRaw(["input", "patch"]);

        sideEffect([$entity, $patch], async ([entity, patch]) => {
          const source = (patch ?? entity) as
            | Record<string, unknown>
            | null
            | undefined;
          if (!source) return;

          for (const field of fields) {
            const value = source[field];
            if (typeof value !== "string" || !value) continue;

            const { flagged } = await moderateText(value);
            if (flagged) throw new Error("content flagged by moderation");
          }
        });

        return plan();
      },
    [sideEffect, moderateText, entityKey, fields],
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
    updateTask: moderateFields("task", ["content", "description"]),
    createPost: moderateFields("post", ["title", "description"]),
    updatePost: moderateFields("post", ["title", "description"]),
    createProject: moderateFields("project", ["description"]),
    updateProject: moderateFields("project", ["description"]),
    createColumn: moderateFields("column", ["title"]),
    updateColumn: moderateFields("column", ["title"]),
  },
});

export default ContentModerationPlugin;
