/**
 * Default Columns Plugin
 *
 * Create default task columns server-side after project creation.
 * This avoids the race condition where client-side column creation
 * fires before the AuthZ sync completes, causing authorization
 * failures on the new project.
 *
 * Inserts directly via Drizzle, bypassing the GraphQL mutation
 * layer (and its authorization check) since this is a system action
 * during project initialization.
 */

import { generateNKeysBetween } from "fractional-indexing";
import { EXPORTABLE } from "graphile-export";
import { context, sideEffect } from "postgraphile/grafast";
import { wrapPlans } from "postgraphile/utils";

import { columns } from "lib/db/schema";

import type { PgInsertSingleStep } from "@dataplan/pg";
import type { ObjectStep } from "postgraphile/grafast";
import type { PlanWrapperFn } from "postgraphile/utils";

const DEFAULT_COLUMNS = [
  { title: "Backlog", icon: "emoji:🌑" },
  { title: "To Do", icon: "emoji:🌒" },
  { title: "In Progress", icon: "emoji:🌓" },
  { title: "Awaiting Review", icon: "emoji:🌖" },
  { title: "Done", icon: "emoji:🌕" },
];

/**
 * Create default columns after project insertion.
 */
const createDefaultColumns = (): PlanWrapperFn =>
  EXPORTABLE(
    (
      context,
      sideEffect,
      columns,
      DEFAULT_COLUMNS,
      generateNKeysBetween,
    ): PlanWrapperFn =>
      (plan) => {
        const $result = plan();
        const $db = context().get("db");

        const $objectResult = $result as ObjectStep<{
          result: PgInsertSingleStep;
        }>;
        const $insertStep = $objectResult.getStepForKey("result");
        const $projectId = $insertStep.get("id");

        sideEffect([$projectId, $db], async ([projectId, db]) => {
          if (!projectId) return;

          const indices = generateNKeysBetween(
            null,
            null,
            DEFAULT_COLUMNS.length,
          );

          await db.insert(columns).values(
            DEFAULT_COLUMNS.map((col, i) => ({
              title: col.title,
              index: indices[i]!,
              icon: col.icon,
              projectId,
            })),
          );
        });

        return $result;
      },
    [context, sideEffect, columns, DEFAULT_COLUMNS, generateNKeysBetween],
  );

/**
 * Plugin that seeds default task columns on project creation.
 */
const DefaultColumnsPlugin = wrapPlans({
  Mutation: {
    createProject: createDefaultColumns(),
  },
});

export default DefaultColumnsPlugin;
