/**
 * AuthZ Sync Plugin
 *
 * Syncs Runa resource mutations to the authorization store (PDP/OpenFGA).
 * Uses sideEffect to run sync logic after mutations complete.
 *
 * Note: Organization membership is managed by IDP (Gatekeeper), which syncs
 * member tuples directly to the AuthZ store. This plugin only handles
 * Runa-specific resources (projects).
 *
 * Authorization model (deployed OpenFGA schema):
 * - organization → workspace (org ID used as workspace ID since Runa has no workspaces)
 * - workspace → project
 * - Settings table is just app preferences, no auth tuples needed
 */

import { EXPORTABLE } from "graphile-export";
import { context, sideEffect } from "postgraphile/grafast";
import { wrapPlans } from "postgraphile/utils";

import {
  deleteTuples,
  isAuthzEnabled,
  isTransactionalSyncMode,
  writeTuples,
} from "lib/authz";

import type { PgDeleteSingleStep, PgInsertSingleStep } from "@dataplan/pg";
import type { InsertProject } from "lib/db/schema";
import type { ObjectStep } from "postgraphile/grafast";
import type { PlanWrapperFn } from "postgraphile/utils";

/**
 * Sync project creation to authz store.
 * Creates workspace → project tuple for permission inheritance.
 * Also ensures org → workspace tuple exists (idempotent).
 *
 * Uses Grafast step methods to extract the project ID during planning phase:
 * - PostGraphile mutations return ObjectStep<{ result: PgInsertSingleStep }>
 * - getStepForKey("result") retrieves the inner insert step
 * - .get("id") creates a step that extracts just the id field
 */
const syncCreateProject = (): PlanWrapperFn =>
  EXPORTABLE(
    (
      context,
      sideEffect,
      isAuthzEnabled,
      isTransactionalSyncMode,
      writeTuples,
    ): PlanWrapperFn =>
      (plan, _, fieldArgs) => {
        const $result = plan();
        const $input = fieldArgs.getRaw(["input", "project"]);
        const $accessToken = context().get("accessToken");

        // Extract project ID using proper Grafast step methods
        // $result is ObjectStep<{ result: PgInsertSingleStep }>
        const $objectResult = $result as ObjectStep<{
          result: PgInsertSingleStep;
        }>;
        const $insertStep = $objectResult.getStepForKey("result");
        const $projectId = $insertStep.get("id");

        sideEffect(
          [$projectId, $input, $accessToken],
          async ([projectId, input, accessToken]) => {
            if (!projectId) return;
            if (!isAuthzEnabled()) return;

            const { organizationId } = input as InsertProject;

            // Use org ID as workspace ID (Runa has no workspace concept)
            // Tuples are idempotent, so org→workspace is safe to write repeatedly
            const result = await writeTuples(
              [
                // Ensure org → workspace link exists
                {
                  user: `organization:${organizationId}`,
                  relation: "organization",
                  object: `workspace:${organizationId}`,
                },
                // Create workspace → project link
                {
                  user: `workspace:${organizationId}`,
                  relation: "workspace",
                  object: `project:${projectId}`,
                },
              ],
              accessToken ?? undefined,
            );

            if (!result.success && isTransactionalSyncMode()) {
              throw new Error(`AuthZ sync failed: ${result.error}`);
            }
          },
        );

        return $result;
      },
    [context, sideEffect, isAuthzEnabled, isTransactionalSyncMode, writeTuples],
  );

/**
 * Sync project deletion to authz store.
 * Removes workspace → project tuple.
 *
 * Uses Grafast step methods to extract data from the delete result:
 * - PgDeleteSingleStep uses PostgreSQL's DELETE ... RETURNING
 * - We can extract organizationId directly from the deleted row
 */
const syncDeleteProject = (): PlanWrapperFn =>
  EXPORTABLE(
    (
      context,
      sideEffect,
      isAuthzEnabled,
      isTransactionalSyncMode,
      deleteTuples,
    ): PlanWrapperFn =>
      (plan, _, _fieldArgs) => {
        const $result = plan();
        const $accessToken = context().get("accessToken");

        // Extract data from the delete step using proper Grafast methods
        // $result is ObjectStep<{ result: PgDeleteSingleStep }>
        // PgDeleteSingleStep uses RETURNING to provide deleted row data
        const $objectResult = $result as ObjectStep<{
          result: PgDeleteSingleStep;
        }>;
        const $deleteStep = $objectResult.getStepForKey("result");
        const $projectId = $deleteStep.get("id");
        // Note: Use snake_case - .get() uses PostgreSQL column names, not JS camelCase
        const $organizationId = $deleteStep.get("organization_id");

        sideEffect(
          [$projectId, $organizationId, $accessToken],
          async ([projectId, organizationId, accessToken]) => {
            if (!projectId || !organizationId) return;
            if (!isAuthzEnabled()) return;

            // Delete workspace → project link (org→workspace stays for other projects)
            const result = await deleteTuples(
              [
                {
                  user: `workspace:${organizationId}`,
                  relation: "workspace",
                  object: `project:${projectId}`,
                },
              ],
              accessToken ?? undefined,
            );

            if (!result.success && isTransactionalSyncMode()) {
              throw new Error(`AuthZ sync failed: ${result.error}`);
            }
          },
        );

        return $result;
      },
    [
      context,
      sideEffect,
      isAuthzEnabled,
      isTransactionalSyncMode,
      deleteTuples,
    ],
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
    // Projects - linked directly to organizations
    createProject: syncCreateProject(),
    deleteProject: syncDeleteProject(),
  },
});

export default AuthzSyncPlugin;
