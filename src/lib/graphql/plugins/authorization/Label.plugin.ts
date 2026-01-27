import { EXPORTABLE } from "graphile-export";
import { context, sideEffect } from "postgraphile/grafast";
import { wrapPlans } from "postgraphile/utils";

import { checkPermission } from "lib/authz";
import { isWithinLimit } from "lib/entitlements";
import { FEATURE_KEYS, billingBypassOrgIds } from "./constants";

import type { InsertLabel } from "lib/db/schema";
import type { PlanWrapperFn } from "postgraphile/utils";
import type { MutationScope } from "./types";

/**
 * Validate label permissions via PDP.
 *
 * Labels can be scoped to either a project or an organization.
 * - Project-scoped: Admin permission on project required
 * - Org-scoped: Admin permission on organization required
 * - Create: Also validates tier limits
 */
const validatePermissions = (propName: string, scope: MutationScope) =>
  EXPORTABLE(
    (
      context,
      sideEffect,
      checkPermission,
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
        const $authzCache = context().get("authzCache");
        const $accessToken = context().get("accessToken");

        sideEffect(
          [$input, $observer, $db, $authzCache, $accessToken],
          async ([input, observer, db, authzCache, accessToken]) => {
            if (!observer) throw new Error("Unauthorized");
            if (!accessToken) throw new Error("Unauthorized");

            if (scope !== "create") {
              // Get label to find scope for AuthZ check
              const label = await db.query.labels.findFirst({
                where: (table, { eq }) => eq(table.id, input),
                columns: { projectId: true, organizationId: true },
              });
              if (!label) throw new Error("Label not found");

              if (label.projectId) {
                // Project-scoped label
                const allowed = await checkPermission(
                  observer.id,
                  "project",
                  label.projectId,
                  "admin",
                  accessToken,
                  authzCache,
                );
                if (!allowed) throw new Error("Unauthorized");
              } else if (label.organizationId) {
                // Org-scoped label
                const allowed = await checkPermission(
                  observer.id,
                  "organization",
                  label.organizationId,
                  "admin",
                  accessToken,
                  authzCache,
                );
                if (!allowed) throw new Error("Unauthorized");
              } else {
                throw new Error("Label has no scope");
              }
            } else {
              const { projectId, organizationId } = input as InsertLabel;

              if (projectId) {
                // Project-scoped label
                const allowed = await checkPermission(
                  observer.id,
                  "project",
                  projectId,
                  "admin",
                  accessToken,
                  authzCache,
                );
                if (!allowed) throw new Error("Unauthorized");

                // Get project with labels for tier limit check
                const project = await db.query.projects.findFirst({
                  where: (table, { eq }) => eq(table.id, projectId),
                  with: { labels: true },
                });
                if (!project) throw new Error("Project not found");

                const withinLimit = await isWithinLimit(
                  { organizationId: project.organizationId },
                  FEATURE_KEYS.MAX_LABELS,
                  project.labels.length,
                  billingBypassOrgIds,
                );
                if (!withinLimit)
                  throw new Error("Maximum number of labels reached");
              } else if (organizationId) {
                // Org-scoped label
                const allowed = await checkPermission(
                  observer.id,
                  "organization",
                  organizationId,
                  "admin",
                  accessToken,
                  authzCache,
                );
                if (!allowed) throw new Error("Unauthorized");

                // TODO: Add tier limit check for org-scoped labels
              } else {
                throw new Error(
                  "Label must have either projectId or organizationId",
                );
              }
            }
          },
        );

        return plan();
      },
    [
      context,
      sideEffect,
      checkPermission,
      isWithinLimit,
      FEATURE_KEYS,
      billingBypassOrgIds,
      propName,
      scope,
    ],
  );

/**
 * Authorization plugin for labels.
 */
const LabelPlugin = wrapPlans({
  Mutation: {
    createLabel: validatePermissions("label", "create"),
    updateLabel: validatePermissions("rowId", "update"),
    deleteLabel: validatePermissions("rowId", "delete"),
  },
});

export default LabelPlugin;
