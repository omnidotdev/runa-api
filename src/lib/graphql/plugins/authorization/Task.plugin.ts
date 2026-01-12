import { EXPORTABLE } from "graphile-export";
import { context, sideEffect } from "postgraphile/grafast";
import { wrapPlans } from "postgraphile/utils";

import { AUTHZ_ENABLED, AUTHZ_PROVIDER_URL, checkPermission } from "lib/authz";
import { isWithinLimit } from "lib/entitlements";
import { FEATURE_KEYS, billingBypassOrgIds } from "./constants";

import type { InsertTask, members } from "lib/db/schema";
import type { PlanWrapperFn } from "postgraphile/utils";
import type { MutationScope } from "./types";

/**
 * Check if user is a member of project's workspace via member table.
 * This handles the race condition where tuple sync hasn't completed yet.
 */
const checkMemberTablePermission = async (
  db: any,
  userId: string,
  projectId: string,
): Promise<boolean> => {
  // Get workspace from project
  const project = await db.query.projects.findFirst({
    where: (table: any, { eq }: any) => eq(table.id, projectId),
    columns: { workspaceId: true },
  });
  if (!project) return false;

  // Any member can create tasks (editor permission)
  const membership = await db.query.members.findFirst({
    where: (table: typeof members, { and, eq }: any) =>
      and(eq(table.userId, userId), eq(table.workspaceId, project.workspaceId)),
  });
  return !!membership;
};

/**
 * Validate task permissions via PDP.
 *
 * - Create: Editor permission on project required (with tier limits)
 * - Update: Editor permission on project required
 * - Delete: Editor permission on project required
 */
const validatePermissions = (propName: string, scope: MutationScope) =>
  EXPORTABLE(
    (
      context,
      sideEffect,
      AUTHZ_ENABLED,
      AUTHZ_PROVIDER_URL,
      checkPermission,
      checkMemberTablePermission,
      isWithinLimit,
      FEATURE_KEYS,
      billingBypassOrgIds,
      propName,
      scope,
    ): PlanWrapperFn =>
      (plan, _, fieldArgs) => {
        const $input = fieldArgs.getRaw(["input", propName]);
        const $observer = context().get("observer");
        const $db = context().get("db");
        const $withPgClient = context().get("withPgClient");
        const $authzCache = context().get("authzCache");

        sideEffect(
          [$input, $observer, $db, $withPgClient, $authzCache],
          async ([input, observer, db, withPgClient, authzCache]) => {
            if (!observer) throw new Error("Unauthorized");

            if (scope === "create") {
              const projectId = (input as InsertTask).projectId;

              let allowed = await checkPermission(
                AUTHZ_ENABLED,
                AUTHZ_PROVIDER_URL,
                observer.id,
                "project",
                projectId,
                "editor",
                authzCache,
              );

              // Fallback: check member table directly (handles race condition)
              if (!allowed) {
                allowed = await checkMemberTablePermission(
                  db,
                  observer.id,
                  projectId,
                );
              }
              if (!allowed) throw new Error("Unauthorized");

              // Get project with workspace for tier limit check
              const project = await db.query.projects.findFirst({
                where: (table, { eq }) => eq(table.id, projectId),
                with: { workspace: true },
              });
              if (!project) throw new Error("Project not found");

              const totalTasks = await withPgClient(null, async (client) => {
                const result = await client.query({
                  text: `SELECT count(*)::int as total FROM task
                         INNER JOIN project ON task.project_id = project.id
                         WHERE project.workspace_id = $1`,
                  values: [project.workspace.id],
                });
                return (
                  (result.rows[0] as { total: number } | undefined)?.total ?? 0
                );
              });

              const withinLimit = await isWithinLimit(
                project.workspace,
                FEATURE_KEYS.MAX_TASKS,
                totalTasks,
                billingBypassOrgIds,
              );
              if (!withinLimit)
                throw new Error("Maximum number of tasks reached");
            } else {
              // Get task to find associated project for permission check
              const task = await db.query.tasks.findFirst({
                where: (table, { eq }) => eq(table.id, input),
                columns: { projectId: true },
              });
              if (!task) throw new Error("Task not found");

              let allowed = await checkPermission(
                AUTHZ_ENABLED,
                AUTHZ_PROVIDER_URL,
                observer.id,
                "project",
                task.projectId,
                "editor",
                authzCache,
              );

              // Fallback: check member table directly (handles race condition)
              if (!allowed) {
                allowed = await checkMemberTablePermission(
                  db,
                  observer.id,
                  task.projectId,
                );
              }
              if (!allowed) throw new Error("Unauthorized");
            }
          },
        );

        return plan();
      },
    [
      context,
      sideEffect,
      AUTHZ_ENABLED,
      AUTHZ_PROVIDER_URL,
      checkPermission,
      checkMemberTablePermission,
      isWithinLimit,
      FEATURE_KEYS,
      billingBypassOrgIds,
      propName,
      scope,
    ],
  );

/**
 * Authorization plugin for tasks.
 *
 * Any member can create tasks. Update/delete requires author or admin+ role.
 * Enforces tier-based task limits.
 */
const TaskPlugin = wrapPlans({
  Mutation: {
    createTask: validatePermissions("task", "create"),
    updateTask: validatePermissions("rowId", "update"),
    deleteTask: validatePermissions("rowId", "delete"),
  },
});

export default TaskPlugin;
