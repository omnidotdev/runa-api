import { EXPORTABLE } from "graphile-export";
import { context, sideEffect } from "postgraphile/grafast";
import { wrapPlans } from "postgraphile/utils";

import { AUTHZ_ENABLED, AUTHZ_PROVIDER_URL, checkPermission } from "lib/authz";
import { isWithinLimit } from "lib/entitlements";
import { FEATURE_KEYS, billingBypassSlugs } from "./constants";

import type { InsertLabel } from "lib/db/schema";
import type { PlanWrapperFn } from "postgraphile/utils";
import type { MutationScope } from "./types";

/**
 * Validate label permissions via PDP.
 *
 * - Create: Admin permission on project required (with tier limits)
 * - Update: Admin permission on project required
 * - Delete: Admin permission on project required
 */
const validatePermissions = (propName: string, scope: MutationScope) =>
  EXPORTABLE(
    (
      context,
      sideEffect,
      AUTHZ_ENABLED,
      AUTHZ_PROVIDER_URL,
      checkPermission,
      isWithinLimit,
      FEATURE_KEYS,
      billingBypassSlugs,
      propName,
      scope,
    ): PlanWrapperFn =>
      (plan, _, fieldArgs) => {
        const $input = fieldArgs.getRaw(["input", propName]);
        const $observer = context().get("observer");
        const $db = context().get("db");

        const $authzCache = context().get("authzCache");

        sideEffect(
          [$input, $observer, $db, $authzCache],
          async ([input, observer, db, authzCache]) => {
            if (!observer) throw new Error("Unauthorized");

            if (scope !== "create") {
              // Get label to find project for AuthZ check
              const label = await db.query.labelTable.findFirst({
                where: (table, { eq }) => eq(table.id, input),
                columns: { projectId: true },
              });
              if (!label) throw new Error("Label not found");

              const allowed = await checkPermission(
                AUTHZ_ENABLED,
                AUTHZ_PROVIDER_URL,
                observer.id,
                "project",
                label.projectId,
                "admin",
                authzCache,
              );
              if (!allowed) throw new Error("Unauthorized");
            } else {
              const projectId = (input as InsertLabel).projectId;

              const allowed = await checkPermission(
                AUTHZ_ENABLED,
                AUTHZ_PROVIDER_URL,
                observer.id,
                "project",
                projectId,
                "admin",
                authzCache,
              );
              if (!allowed) throw new Error("Unauthorized");

              // Get project with labels and workspace for tier limit check
              const project = await db.query.projectTable.findFirst({
                where: (table, { eq }) => eq(table.id, projectId),
                with: { labels: true, workspace: true },
              });
              if (!project) throw new Error("Project not found");

              const withinLimit = await isWithinLimit(
                project.workspace,
                FEATURE_KEYS.MAX_LABELS,
                project.labels.length,
                billingBypassSlugs,
              );
              if (!withinLimit)
                throw new Error("Maximum number of labels reached");
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
      isWithinLimit,
      FEATURE_KEYS,
      billingBypassSlugs,
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
