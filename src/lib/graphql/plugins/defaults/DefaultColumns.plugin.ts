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

import { EXPORTABLE } from "graphile-export";
import { context, sideEffect } from "postgraphile/grafast";
import { wrapPlans } from "postgraphile/utils";

import { columns } from "lib/db/schema";

import type { PgInsertSingleStep } from "@dataplan/pg";
import type { ObjectStep } from "postgraphile/grafast";
import type { PlanWrapperFn } from "postgraphile/utils";

const DEFAULT_COLUMNS = [
  { title: "Backlog", index: 0, icon: "emoji:🌑" },
  { title: "To Do", index: 1, icon: "emoji:🌒" },
  { title: "In Progress", index: 2, icon: "emoji:🌓" },
  { title: "Awaiting Review", index: 3, icon: "emoji:🌖" },
  { title: "Done", index: 4, icon: "emoji:🌕" },
];

/**
 * Create default columns after project insertion.
 */
const createDefaultColumns = (): PlanWrapperFn =>
  EXPORTABLE(
    (context, sideEffect, columns, DEFAULT_COLUMNS): PlanWrapperFn =>
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

          await db.insert(columns).values(
            DEFAULT_COLUMNS.map(
              (col: { title: string; index: number; icon: string }) => ({
                title: col.title,
                index: col.index,
                icon: col.icon,
                projectId,
              }),
            ),
          );
        });

        return $result;
      },
    [context, sideEffect, columns, DEFAULT_COLUMNS],
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
