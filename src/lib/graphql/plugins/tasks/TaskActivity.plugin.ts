import { EXPORTABLE } from "graphile-export";
import { context, lambda } from "postgraphile/grafast";
import { gql, makeExtendSchemaPlugin } from "postgraphile/utils";

import { checkPermission } from "lib/authz";
import { fetchTaskActivity } from "lib/chronicle/taskActivity";
import { pgPool } from "lib/db/db";

/**
 * Custom taskActivity(taskId) query.
 *
 * Reads a task's audit/activity trail from Chronicle. Chronicle's read API has
 * no auth, so this resolver resolves the task's OWN organization server-side and
 * passes only that org id (never a client value), after checking the caller has
 * Member permission on the task's project. Returns [] when Chronicle is unset.
 */

/** Reads one property off an activity entry (or null). */
const entryField = (key: string) =>
  EXPORTABLE(
    (lambda, key) =>
      // biome-ignore lint/suspicious/noExplicitAny: grafast plan step
      ($entry: any) =>
        lambda(
          $entry,
          (e) => (e as Record<string, unknown> | null)?.[key] ?? null,
        ),
    [lambda, key],
  );

const TaskActivityPlugin = makeExtendSchemaPlugin(() => ({
  typeDefs: gql`
    """
    A single audit/activity entry for a task, sourced from Chronicle.
    """
    type TaskActivityEntry {
      "Chronicle event id."
      id: String
      "Machine action, e.g. task.updated."
      action: String
      "Display name of who performed the action, if known."
      actorName: String
      "Human-readable summary, e.g. \\"Alice updated task 'MRKT-3'\\"."
      summary: String
      "Field-level detail for updates, e.g. \\"moved this task to Done\\"."
      detail: String
      "ISO timestamp the event occurred."
      occurredAt: String
      "Relative time for display, e.g. \\"2 hours ago\\"."
      relativeTime: String
    }

    extend type Query {
      """
      Audit/activity trail for a task (most recent first). Requires Member
      permission on the task's project. Empty when Chronicle is not configured.
      """
      taskActivity(taskId: UUID!): [TaskActivityEntry!]
    }
  `,
  plans: {
    TaskActivityEntry: {
      id: entryField("id"),
      action: entryField("action"),
      actorName: entryField("actorName"),
      summary: entryField("summary"),
      detail: entryField("detail"),
      occurredAt: entryField("occurredAt"),
      relativeTime: entryField("relativeTime"),
    },
    Query: {
      taskActivity: EXPORTABLE(
        (context, lambda, checkPermission, fetchTaskActivity, pgPool) =>
          // biome-ignore lint/suspicious/noExplicitAny: grafast plan signature
          (_$root: any, fieldArgs: any) => {
            const $taskId = fieldArgs.getRaw("taskId");
            const $observer = context().get("observer");
            const $accessToken = context().get("accessToken");
            const $authzCache = context().get("authzCache");
            return lambda(
              [$observer, $accessToken, $authzCache, $taskId],
              // biome-ignore lint/suspicious/noExplicitAny: grafast lambda values
              async ([observer, accessToken, authzCache, taskId]: any) => {
                if (!observer || !accessToken) throw new Error("Unauthorized");

                const res = await pgPool.query(
                  `SELECT p.id AS project_id, p.organization_id
                   FROM task t JOIN project p ON p.id = t.project_id
                   WHERE t.id = $1`,
                  [taskId],
                );
                const row = res.rows[0] as
                  | { project_id: string; organization_id: string }
                  | undefined;
                if (!row) throw new Error("Task not found");

                const allowed = await checkPermission(
                  observer.identityProviderId,
                  "project",
                  row.project_id,
                  "member",
                  accessToken,
                  authzCache,
                );
                if (!allowed) throw new Error("Unauthorized");

                return fetchTaskActivity({
                  organizationId: row.organization_id,
                  taskId,
                });
              },
              false,
            );
          },
        [context, lambda, checkPermission, fetchTaskActivity, pgPool],
      ),
    },
  },
}));

export default TaskActivityPlugin;
