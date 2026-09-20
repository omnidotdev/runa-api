import { EXPORTABLE } from "graphile-export";
import { context, lambda } from "postgraphile/grafast";
import { gql, makeExtendSchemaPlugin } from "postgraphile/utils";

import { checkPermission } from "lib/authz";
import { pgPool } from "lib/db/db";
import { moveTask } from "lib/tasks/moveTask";

/**
 * Custom moveTask mutation.
 *
 * A task move cannot go through the CRUD updateTask: the task-number trigger only
 * fires on INSERT, so a moved task would collide on the (project_id, number) unique
 * constraint. moveTask (lib/tasks/moveTask) reassigns the number from the target
 * project, appends to the target column, and drops label links scoped to the old
 * project, all in one transaction. Here we enforce editor permission on BOTH the
 * source and target project before running it; the helper additionally rejects
 * cross-workspace moves.
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

const MoveTaskPlugin = makeExtendSchemaPlugin(() => ({
  typeDefs: gql`
    """
    Input for moving a task to a column in another project (same workspace).
    """
    input MoveTaskInput {
      "The task to move."
      taskId: UUID!
      "The destination project."
      projectId: UUID!
      "A column belonging to the destination project."
      columnId: UUID!
    }

    """
    Result of a moveTask mutation.
    """
    type MoveTaskPayload {
      "The moved task's id."
      taskId: UUID
      "The task's newly assigned number in the destination project."
      number: Int
      "The destination project id."
      projectId: UUID
      "The destination column id."
      columnId: UUID
      "The task's new fractional index within the destination column."
      columnIndex: String
    }

    extend type Mutation {
      """
      Move a task to a column in another project within the same workspace.
      Requires editor permission on both the source and destination project.
      """
      moveTask(input: MoveTaskInput!): MoveTaskPayload
    }
  `,
  plans: {
    MoveTaskPayload: {
      taskId: rowField("id"),
      number: rowField("number"),
      projectId: rowField("projectId"),
      columnId: rowField("columnId"),
      columnIndex: rowField("columnIndex"),
    },
    Mutation: {
      moveTask: EXPORTABLE(
        (context, lambda, checkPermission, moveTask, pgPool) =>
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

                const taskRes = await pgPool.query(
                  "SELECT project_id FROM task WHERE id = $1",
                  [input.taskId],
                );
                const sourceProjectId = taskRes.rows[0]?.project_id as
                  | string
                  | undefined;
                if (!sourceProjectId) throw new Error("Task not found");

                const [okSource, okTarget] = await Promise.all([
                  checkPermission(
                    observer.identityProviderId,
                    "project",
                    sourceProjectId,
                    "editor",
                    accessToken,
                    authzCache,
                  ),
                  checkPermission(
                    observer.identityProviderId,
                    "project",
                    input.projectId,
                    "editor",
                    accessToken,
                    authzCache,
                  ),
                ]);
                if (!okSource || !okTarget) throw new Error("Unauthorized");

                return moveTask(pgPool, {
                  taskId: input.taskId,
                  targetProjectId: input.projectId,
                  targetColumnId: input.columnId,
                });
              },
              false,
            );
          },
        [context, lambda, checkPermission, moveTask, pgPool],
      ),
    },
  },
}));

export default MoveTaskPlugin;
