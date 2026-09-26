import { EXPORTABLE } from "graphile-export";
import { context, lambda } from "postgraphile/grafast";
import { gql, makeExtendSchemaPlugin } from "postgraphile/utils";

import { checkPermission } from "lib/authz";
import { pgPool } from "lib/db/db";
import { convertChecklistItemToTask } from "lib/tasks/convertChecklistItemToTask";

/**
 * Custom convertChecklistItemToTask mutation.
 *
 * Promotes a checklist item into a standalone task in one transaction: the item's
 * text becomes a new task in the first column of the origin task's project (with
 * source_task_id pointing back), and the item is deleted. Doing it CRUD-side would
 * need three round trips with no atomicity. Requires editor permission on the
 * project that owns the item's origin task.
 */

/** Reads one property off the returned result row (or null). */
const rowField = (key: string) =>
  EXPORTABLE(
    (lambda, key) =>
      // biome-ignore lint/suspicious/noExplicitAny: grafast plan step
      ($row: any) =>
        lambda(
          $row,
          (r) => (r as Record<string, unknown> | null)?.[key] ?? null,
        ),
    [lambda, key],
  );

const ConvertChecklistItemToTaskPlugin = makeExtendSchemaPlugin(() => ({
  typeDefs: gql`
    """
    Input for converting a checklist item into a standalone task.
    """
    input ConvertChecklistItemToTaskInput {
      "The checklist item to convert."
      checklistItemId: UUID!
    }

    """
    Result of a convertChecklistItemToTask mutation.
    """
    type ConvertChecklistItemToTaskPayload {
      "The new task's id."
      taskId: UUID
      "The new task's assigned number within its project."
      number: Int
      "The project the new task was created in."
      projectId: UUID
      "The column the new task was placed in (the project's first column)."
      columnId: UUID
      "The new task's fractional index within its column."
      columnIndex: String
      "The origin task the checklist item belonged to."
      sourceTaskId: UUID
    }

    extend type Mutation {
      """
      Convert a checklist item into a standalone task in the origin task's
      project. The item is removed and the new task links back via sourceTaskId.
      Requires editor permission on the project.
      """
      convertChecklistItemToTask(
        input: ConvertChecklistItemToTaskInput!
      ): ConvertChecklistItemToTaskPayload
    }
  `,
  plans: {
    ConvertChecklistItemToTaskPayload: {
      taskId: rowField("id"),
      number: rowField("number"),
      projectId: rowField("projectId"),
      columnId: rowField("columnId"),
      columnIndex: rowField("columnIndex"),
      sourceTaskId: rowField("sourceTaskId"),
    },
    Mutation: {
      convertChecklistItemToTask: EXPORTABLE(
        (
          context,
          lambda,
          checkPermission,
          convertChecklistItemToTask,
          pgPool,
        ) =>
          // biome-ignore lint/suspicious/noExplicitAny: grafast plan signature
          (_$root: any, fieldArgs: any) => {
            const $input = fieldArgs.getRaw("input");
            const $observer = context().get("observer");
            const $accessToken = context().get("accessToken");
            const $authzCache = context().get("authzCache");
            return lambda(
              [$observer, $accessToken, $authzCache, $input],
              // biome-ignore lint/suspicious/noExplicitAny: grafast lambda values
              async ([observer, accessToken, authzCache, input]: any) => {
                if (!observer || !accessToken) {
                  throw new Error("Unauthorized");
                }

                const projectRes = await pgPool.query(
                  `SELECT t.project_id
                   FROM checklist_item ci
                   JOIN checklist c ON c.id = ci.checklist_id
                   JOIN task t ON t.id = c.task_id
                   WHERE ci.id = $1`,
                  [input.checklistItemId],
                );
                const projectId = projectRes.rows[0]?.project_id as
                  | string
                  | undefined;
                if (!projectId) throw new Error("Checklist item not found");

                const ok = await checkPermission(
                  observer.identityProviderId,
                  "project",
                  projectId,
                  "editor",
                  accessToken,
                  authzCache,
                );
                if (!ok) throw new Error("Unauthorized");

                return convertChecklistItemToTask(pgPool, {
                  checklistItemId: input.checklistItemId,
                });
              },
              false,
            );
          },
        [context, lambda, checkPermission, convertChecklistItemToTask, pgPool],
      ),
    },
  },
}));

export default ConvertChecklistItemToTaskPlugin;
