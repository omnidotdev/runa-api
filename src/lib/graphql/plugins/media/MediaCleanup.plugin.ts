import { EXPORTABLE } from "graphile-export";
import { context, sideEffect } from "postgraphile/grafast";
import { wrapPlans } from "postgraphile/utils";

import {
  cleanupAllProjectMedia,
  cleanupDereferencedMedia,
} from "lib/media/cleanupProjectMedia";

import type { ProjectMediaSnapshot } from "lib/media/projectMediaKeys";
import type { PlanWrapperFn } from "postgraphile/utils";

/**
 * Delete object-storage media orphaned by a project update.
 *
 * When an `updateProject` patch changes `image` or `background` so a previously
 * referenced object is no longer pointed at (replace, remove, or switch to a
 * preset), the old object is best-effort deleted. Every such reference change
 * flows through this mutation, the upload routes only store bytes, so this one
 * place covers both fields and all dereference paths.
 *
 * Two phases keep it safe. Side-effect steps run in creation order, so the
 * pre-mutation step snapshots the old media (carried forward as a step value,
 * not a closure, so it stays exportable) while the row is still readable, and
 * the post-mutation step, gated on the mutation result, runs only after the
 * update commits. An unauthorized or failed update therefore deletes nothing,
 * and a rollback can never orphan a live reference. Deletes are best-effort and
 * never throw, so cleanup can't fail the mutation.
 */
const cleanupOnUpdate = (): PlanWrapperFn =>
  EXPORTABLE(
    (context, sideEffect, cleanupDereferencedMedia): PlanWrapperFn =>
      (plan, _, fieldArgs) => {
        const $rowId = fieldArgs.getRaw(["input", "rowId"]);
        const $patch = fieldArgs.getRaw(["input", "patch"]);
        const $db = context().get("db");

        // Pre-mutation snapshot of the old media (runs before the update by
        // creation order); its result flows into the post-mutation step.
        const $old = sideEffect(
          [$rowId, $patch, $db],
          async ([rowId, patch, db]) => {
            const p = patch as Record<string, unknown> | null;
            if (!rowId || !p || !("image" in p || "background" in p)) {
              return undefined;
            }
            return (
              (await db.query.projects.findFirst({
                // biome-ignore lint/suspicious/noExplicitAny: drizzle where callback
                where: (fields: any, operators: any) =>
                  operators.eq(fields.id, rowId as string),
                columns: { image: true, background: true },
              })) ?? undefined
            );
          },
        );

        const $result = plan();

        sideEffect([$result, $old, $patch], async ([result, old, patch]) => {
          if (!result) return;
          await cleanupDereferencedMedia(
            old as ProjectMediaSnapshot | undefined,
            patch as Record<string, unknown>,
          );
        });

        return $result;
      },
    [context, sideEffect, cleanupDereferencedMedia],
  );

/**
 * Delete every object-storage media a project referenced when the whole project
 * is deleted. Same two-phase shape as the update cleanup: snapshot the media
 * pre-delete, free it only after the delete commits.
 */
const cleanupOnDelete = (): PlanWrapperFn =>
  EXPORTABLE(
    (context, sideEffect, cleanupAllProjectMedia): PlanWrapperFn =>
      (plan, _, fieldArgs) => {
        const $rowId = fieldArgs.getRaw(["input", "rowId"]);
        const $db = context().get("db");

        const $old = sideEffect([$rowId, $db], async ([rowId, db]) => {
          if (!rowId) return undefined;
          return (
            (await db.query.projects.findFirst({
              // biome-ignore lint/suspicious/noExplicitAny: drizzle where callback
              where: (fields: any, operators: any) =>
                operators.eq(fields.id, rowId as string),
              columns: { image: true, background: true },
            })) ?? undefined
          );
        });

        const $result = plan();

        sideEffect([$result, $old], async ([result, old]) => {
          if (!result) return;
          await cleanupAllProjectMedia(old as ProjectMediaSnapshot | undefined);
        });

        return $result;
      },
    [context, sideEffect, cleanupAllProjectMedia],
  );

/**
 * Media cleanup plugin: removes orphaned object-storage media when a project's
 * image or background is replaced, removed, or switched away from, or when the
 * whole project is deleted.
 */
const MediaCleanupPlugin = wrapPlans({
  Mutation: {
    updateProject: cleanupOnUpdate(),
    deleteProject: cleanupOnDelete(),
  },
});

export default MediaCleanupPlugin;
