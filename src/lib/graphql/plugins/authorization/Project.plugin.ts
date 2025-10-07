import { EXPORTABLE } from "graphile-export";
import { context, sideEffect } from "postgraphile/grafast";
import { makeWrapPlansPlugin } from "postgraphile/utils";
import { match } from "ts-pattern";

import { BASIC_TIER_MAX_PROJECTS, FREE_TIER_MAX_PROJECTS } from "./constants";

import type { InsertProject } from "lib/db/schema";
import type { GraphQLContext } from "lib/graphql/createGraphqlContext";
import type { ExecutableStep, FieldArgs } from "postgraphile/grafast";
import type { MutationScope } from "./types";

const validatePermissions = (propName: string, scope: MutationScope) =>
  EXPORTABLE(
    (
      match,
      context,
      sideEffect,
      FREE_TIER_MAX_PROJECTS,
      BASIC_TIER_MAX_PROJECTS,
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
            const project = await db.query.projectTable.findFirst({
              where: (table, { eq }) => eq(table.id, input),
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

            if (!project?.workspace?.workspaceUsers?.length)
              throw new Error("Unauthorized");

            // TODO: determine proper permissions
            if (
              scope === "delete" &&
              project.workspace.workspaceUsers[0].role !== "owner"
            )
              throw new Error("Unauthorized");

            if (
              scope === "update" &&
              project.workspace.workspaceUsers[0].role === "member"
            )
              throw new Error("Unauthorized");
          } else {
            const workspaceId = (input as InsertProject).workspaceId;

            const workspace = await db.query.workspaceTable.findFirst({
              where: (table, { eq }) => eq(table.id, workspaceId),
              with: {
                workspaceUsers: {
                  where: (table, { eq }) => eq(table.userId, observer.id),
                },
                projects: true,
              },
            });

            if (!workspace?.workspaceUsers?.length)
              throw new Error("Unauthorized");

            // TODO: determine proper permissions, including tier based
            if (workspace.workspaceUsers[0].role === "member")
              throw new Error("Unauthorized");

            const tier = workspace.tier;

            const permission = match(tier)
              .with(
                "free",
                () => workspace.projects.length < FREE_TIER_MAX_PROJECTS,
              )
              .with(
                "basic",
                () => workspace.projects.length < BASIC_TIER_MAX_PROJECTS,
              )
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
      FREE_TIER_MAX_PROJECTS,
      BASIC_TIER_MAX_PROJECTS,
      propName,
      scope,
    ],
  );

export default makeWrapPlansPlugin({
  Mutation: {
    createProject: validatePermissions("project", "create"),
    updateProject: validatePermissions("rowId", "update"),
    deleteProject: validatePermissions("rowId", "delete"),
  },
});
