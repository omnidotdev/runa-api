import { EXPORTABLE } from "graphile-export";
import { context, sideEffect } from "postgraphile/grafast";
import { wrapPlans } from "postgraphile/utils";
import { match } from "ts-pattern";

import {
  BASIC_TIER_MAX_PROJECTS,
  billingBypassSlugs,
  FREE_TIER_MAX_PROJECTS,
} from "./constants";

import type { InsertProject } from "lib/db/schema";
import type { PlanWrapperFn } from "postgraphile/utils";
import type { MutationScope } from "./types";

/**
 * Validate project permissions.
 *
 * Projects require admin+ role for mutations.
 * - Create: Admin+ can create projects (with tier limits)
 * - Update: Admin+ can modify projects
 * - Delete: Admin+ can delete projects
 */
const validatePermissions = (propName: string, scope: MutationScope) =>
  EXPORTABLE(
    (
      match,
      context,
      sideEffect,
      FREE_TIER_MAX_PROJECTS,
      BASIC_TIER_MAX_PROJECTS,
      billingBypassSlugs,
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
              const workspaceId = (input as InsertProject).workspaceId;

              // Get workspace with membership check
              const workspace = await db.query.workspaceTable.findFirst({
                where: (table, { eq }) => eq(table.id, workspaceId),
                with: {
                  workspaceUsers: {
                    where: (table, { eq }) => eq(table.userId, observer.id),
                  },
                },
              });

              if (!workspace?.workspaceUsers?.length)
                throw new Error("Unauthorized");

              // admin+ can create projects
              if (workspace.workspaceUsers[0].role === "member")
                throw new Error("Unauthorized");

              const totalProjects = await withPgClient(null, async (client) => {
                const result = await client.query({
                  text: "SELECT count(*)::int as total FROM project WHERE workspace_id = $1",
                  values: [workspaceId],
                });
                return (
                  (result.rows[0] as { total: number } | undefined)?.total ?? 0
                );
              });

              // Bypass tier limits for exempt workspaces
              if (!billingBypassSlugs.includes(workspace.slug)) {
                const withinLimit = match(workspace.tier)
                  .with("free", () => totalProjects < FREE_TIER_MAX_PROJECTS)
                  .with("basic", () => totalProjects < BASIC_TIER_MAX_PROJECTS)
                  .with("team", () => true)
                  .exhaustive();

                if (!withinLimit)
                  throw new Error("Maximum number of projects reached");
              }
            } else {
              // for update/delete, verify workspace membership and admin+ role
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

              // admin+ can update/delete projects
              if (project.workspace.workspaceUsers[0].role === "member")
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
      FREE_TIER_MAX_PROJECTS,
      BASIC_TIER_MAX_PROJECTS,
      billingBypassSlugs,
      propName,
      scope,
    ],
  );

/**
 * Authorization plugin for projects.
 *
 * Enforces admin+ requirement for project management.
 * Enforces tier-based project limits.
 */
const ProjectPlugin = wrapPlans({
  Mutation: {
    createProject: validatePermissions("project", "create"),
    updateProject: validatePermissions("rowId", "update"),
    deleteProject: validatePermissions("rowId", "delete"),
  },
});

export default ProjectPlugin;
