/**
 * AuthZ Sync Plugin
 *
 * Syncs Runa resource mutations to the authorization store (PDP/OpenFGA).
 * Uses sideEffect to run sync logic after mutations complete.
 *
 * Note: Organization membership is managed by IDP (Gatekeeper), which syncs
 * member tuples directly to the AuthZ store. This plugin only handles
 * Runa-specific resources (workspaces, projects).
 */

import { EXPORTABLE } from "graphile-export";
import { context, sideEffect } from "postgraphile/grafast";
import { wrapPlans } from "postgraphile/utils";

import {
  AUTHZ_ENABLED,
  AUTHZ_PROVIDER_URL,
  deleteTuples,
  writeTuples,
} from "lib/authz";

import type { InsertProject } from "lib/db/schema";
import type { PlanWrapperFn } from "postgraphile/utils";

/**
 * Sync project creation to authz store.
 */
const syncCreateProject = (): PlanWrapperFn =>
  EXPORTABLE(
    (
      _context,
      sideEffect,
      AUTHZ_ENABLED,
      AUTHZ_PROVIDER_URL,
      writeTuples,
    ): PlanWrapperFn =>
      (plan, _, fieldArgs) => {
        const $result = plan();
        const $input = fieldArgs.getRaw(["input", "project"]);

        sideEffect([$result, $input], async ([result, input]) => {
          if (!result) return;
          if (AUTHZ_ENABLED !== "true") return;
          if (!AUTHZ_PROVIDER_URL) return;

          const { workspaceId } = input as InsertProject;
          // The result should contain the created project's ID
          const projectId = (result as { id?: string })?.id;

          if (!projectId) {
            console.error("[AuthZ Sync] Project ID not found in result");
            return;
          }

          try {
            await writeTuples(AUTHZ_PROVIDER_URL, [
              {
                user: `workspace:${workspaceId}`,
                relation: "workspace",
                object: `project:${projectId}`,
              },
            ]);
          } catch (error) {
            console.error(
              "[AuthZ Sync] Failed to sync project creation:",
              error,
            );
          }
        });

        return $result;
      },
    [context, sideEffect, AUTHZ_ENABLED, AUTHZ_PROVIDER_URL, writeTuples],
  );

/**
 * Sync project deletion to authz store.
 */
const syncDeleteProject = (): PlanWrapperFn =>
  EXPORTABLE(
    (
      context,
      sideEffect,
      AUTHZ_ENABLED,
      AUTHZ_PROVIDER_URL,
      deleteTuples,
    ): PlanWrapperFn =>
      (plan, _, fieldArgs) => {
        const $result = plan();
        const $projectId = fieldArgs.getRaw(["input", "rowId"]);
        const $db = context().get("db");

        sideEffect(
          [$result, $projectId, $db],
          async ([result, projectId, db]) => {
            if (!result) return;
            if (AUTHZ_ENABLED !== "true") return;
            if (!AUTHZ_PROVIDER_URL) return;

            // Get the workspace ID before deletion
            const project = await db.query.projects.findFirst({
              where: (table, { eq }) => eq(table.id, projectId as string),
            });

            if (!project) return;

            try {
              await deleteTuples(AUTHZ_PROVIDER_URL, [
                {
                  user: `workspace:${project.workspaceId}`,
                  relation: "workspace",
                  object: `project:${projectId}`,
                },
              ]);
            } catch (error) {
              console.error(
                "[AuthZ Sync] Failed to sync project deletion:",
                error,
              );
            }
          },
        );

        return $result;
      },
    [context, sideEffect, AUTHZ_ENABLED, AUTHZ_PROVIDER_URL, deleteTuples],
  );

/**
 * Sync workspace creation - adds organization→workspace tuple.
 */
const syncCreateWorkspace = (): PlanWrapperFn =>
  EXPORTABLE(
    (
      _context,
      sideEffect,
      AUTHZ_ENABLED,
      AUTHZ_PROVIDER_URL,
      writeTuples,
    ): PlanWrapperFn =>
      (plan, _, fieldArgs) => {
        const $result = plan();
        const $input = fieldArgs.getRaw(["input", "workspace"]);

        sideEffect([$result, $input], async ([result, input]) => {
          if (!result) return;
          if (AUTHZ_ENABLED !== "true") return;
          if (!AUTHZ_PROVIDER_URL) return;

          const workspaceId = (result as { id?: string })?.id;
          const organizationId = (input as { organizationId?: string })
            ?.organizationId;

          if (!workspaceId) {
            console.error("[AuthZ Sync] Workspace ID not found in result");
            return;
          }

          try {
            const tuples = [];

            // Link workspace to organization for permission inheritance
            if (organizationId) {
              tuples.push({
                user: `organization:${organizationId}`,
                relation: "organization",
                object: `workspace:${workspaceId}`,
              });
            }

            if (tuples.length > 0) {
              await writeTuples(AUTHZ_PROVIDER_URL, tuples);
            }
          } catch (error) {
            console.error(
              "[AuthZ Sync] Failed to sync workspace creation:",
              error,
            );
          }
        });

        return $result;
      },
    [context, sideEffect, AUTHZ_ENABLED, AUTHZ_PROVIDER_URL, writeTuples],
  );

/**
 * AuthZ Sync Plugin
 *
 * Syncs resource mutations to the authorization store.
 * Errors are logged but don't fail mutations - eventual consistency.
 *
 * Note: Member tuples (user→organization relationships) are synced by IDP,
 * not by this plugin. This plugin only handles resource relationships.
 */
const AuthzSyncPlugin = wrapPlans({
  Mutation: {
    // Workspaces
    createWorkspace: syncCreateWorkspace(),

    // Projects
    createProject: syncCreateProject(),
    deleteProject: syncDeleteProject(),
  },
});

export default AuthzSyncPlugin;
