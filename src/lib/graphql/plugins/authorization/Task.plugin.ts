import { EXPORTABLE } from "graphile-export";
import { context, sideEffect } from "postgraphile/grafast";
import { wrapPlans } from "postgraphile/utils";
import { match } from "ts-pattern";

import { BASIC_TIER_MAX_TASKS, FREE_TIER_MAX_TASKS } from "./constants";

import type { InsertTask } from "lib/db/schema";
import type { PlanWrapperFn } from "postgraphile/utils";
import type { MutationScope } from "./types";

/**
 * Validate task permissions.
 *
 * - Create: Any workspace member can create tasks (with tier limits)
 * - Update: Task author OR admin+ can modify tasks
 * - Delete: Task author OR admin+ can delete tasks
 */
const validatePermissions = (propName: string, scope: MutationScope) =>
  EXPORTABLE(
    (
      match,
      context,
      sideEffect,
      FREE_TIER_MAX_TASKS,
      BASIC_TIER_MAX_TASKS,
      propName,
      scope,
    ): PlanWrapperFn =>
      (plan, _, fieldArgs) => {
        const $input = fieldArgs.getRaw(["input", propName]);
        const $observer = context().get("observer");
        const $db = context().get("db");
        const $withPgClient = context().get("withPgClient");

        sideEffect(
          [$input, $observer, $db, $withPgClient],
          async ([input, observer, db, withPgClient]) => {
            if (!observer) throw new Error("Unauthorized");

            if (scope === "create") {
              const projectId = (input as InsertTask).projectId;

              // Get project with workspace membership check
              const project = await db.query.projectTable.findFirst({
                where: (table, { eq }) => eq(table.id, projectId),
                with: {
                  workspace: {
                    with: {
                      workspaceUsers: {
                        where: (table, { eq }) => eq(table.userId, observer.id),
                      },
                    },
                  },
                },
              });

              if (!project?.workspace.workspaceUsers.length)
                throw new Error("Unauthorized");

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

              const withinLimit = match(project.workspace.tier)
                .with("free", () => totalTasks < FREE_TIER_MAX_TASKS)
                .with("basic", () => totalTasks < BASIC_TIER_MAX_TASKS)
                .with("team", () => true)
                .exhaustive();

              if (!withinLimit)
                throw new Error("Maximum number of tasks reached");
            } else {
              // for update/delete, verify membership and author/admin+ permission
              const task = await db.query.taskTable.findFirst({
                where: (table, { eq }) => eq(table.id, input),
                with: {
                  project: {
                    with: {
                      workspace: {
                        with: {
                          workspaceUsers: {
                            where: (table, { eq }) =>
                              eq(table.userId, observer.id),
                          },
                        },
                      },
                    },
                  },
                },
              });

              if (!task?.project.workspace.workspaceUsers.length)
                throw new Error("Unauthorized");

              // author or admin+ can modify/delete tasks
              if (
                task.authorId !== observer.id &&
                task.project.workspace.workspaceUsers[0].role === "member"
              )
                throw new Error("Unauthorized");
            }
          },
        );

        return plan();
      },
    [
      match,
      context,
      sideEffect,
      FREE_TIER_MAX_TASKS,
      BASIC_TIER_MAX_TASKS,
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
