import { EXPORTABLE } from "graphile-export";
import { context, sideEffect } from "postgraphile/grafast";
import { makeWrapPlansPlugin } from "postgraphile/utils";
import { match } from "ts-pattern";

import { BASIC_TIER_MAX_TASKS, FREE_TIER_MAX_TASKS } from "./constants";

import type { InsertTask } from "lib/db/schema";
import type { GraphQLContext } from "lib/graphql/createGraphqlContext";
import type { ExecutableStep, FieldArgs } from "postgraphile/grafast";
import type { MutationScope } from "./types";

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
    ) =>
      // biome-ignore lint: no exported plan type
      (plan: any, _: ExecutableStep, fieldArgs: FieldArgs) => {
        const $input = fieldArgs.getRaw(["input", propName]);
        const $observer = context<GraphQLContext>().get("observer");
        const $db = context<GraphQLContext>().get("db");

        sideEffect([$input, $observer, $db], async ([input, observer, db]) => {
          if (!observer) throw new Error("Unauthorized");

          if (scope !== "create") {
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

            // TODO: determine proper permissions
            if (
              task.authorId !== observer.id &&
              task.project.workspace.workspaceUsers[0].role === "member"
            )
              throw new Error("Unauthorized");
          } else {
            const projectId = (input as InsertTask).projectId;

            const project = await db.query.projectTable.findFirst({
              where: (table, { eq }) => eq(table.id, projectId),
              with: {
                workspace: {
                  with: {
                    workspaceUsers: {
                      where: (table, { eq }) => eq(table.userId, observer.id),
                    },
                    projects: {
                      with: {
                        tasks: true,
                      },
                    },
                  },
                },
              },
            });

            if (!project?.workspace.workspaceUsers.length)
              throw new Error("Unauthorized");

            const allWorkspaceProjects = project.workspace.projects;

            const totalTasks = allWorkspaceProjects.reduce(
              (acc, project) => acc + project.tasks.length,
              0,
            );

            const permission = match(project.workspace.tier)
              .with("free", () => totalTasks < FREE_TIER_MAX_TASKS)
              .with("basic", () => totalTasks < BASIC_TIER_MAX_TASKS)
              .with("team", () => true)
              .exhaustive();

            if (!permission) throw new Error("Unauthorized");
          }
        });

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

export default makeWrapPlansPlugin({
  Mutation: {
    createTask: validatePermissions("task", "create"),
    updateTask: validatePermissions("rowId", "update"),
    deleteTask: validatePermissions("rowId", "delete"),
  },
});
