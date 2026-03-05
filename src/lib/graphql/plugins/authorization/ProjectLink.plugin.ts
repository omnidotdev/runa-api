import { EXPORTABLE } from "graphile-export";
import { context, sideEffect } from "postgraphile/grafast";
import { wrapPlans } from "postgraphile/utils";

import { checkPermission } from "lib/authz";

import type { InsertProjectLink } from "lib/db/schema";
import type { PlanWrapperFn } from "postgraphile/utils";
import type { MutationScope } from "./types";

/**
 * Validate project link permissions via PDP.
 *
 * - Create: Admin permission on project required
 * - Update: Admin permission on project required
 * - Delete: Admin permission on project required
 */
const validatePermissions = (propName: string, scope: MutationScope) =>
  EXPORTABLE(
    (context, sideEffect, checkPermission, propName, scope): PlanWrapperFn =>
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

            if (scope === "create") {
              const projectId = (input as InsertProjectLink).projectId;

              const allowed = await checkPermission(
                observer.identityProviderId,
                "project",
                projectId,
                "admin",
                accessToken,
                authzCache,
              );
              if (!allowed) throw new Error("Unauthorized");
            } else {
              const projectLink = await db.query.projectLinks.findFirst({
                where: (table, { eq }) => eq(table.id, input),
                columns: { projectId: true },
              });
              if (!projectLink) throw new Error("Project link not found");

              const allowed = await checkPermission(
                observer.identityProviderId,
                "project",
                projectLink.projectId,
                "admin",
                accessToken,
                authzCache,
              );
              if (!allowed) throw new Error("Unauthorized");
            }
          },
        );

        return plan();
      },
    [context, sideEffect, checkPermission, propName, scope],
  );

/**
 * Authorization plugin for project links.
 *
 * Enforces admin+ requirement for link management.
 */
const ProjectLinkPlugin = wrapPlans({
  Mutation: {
    createProjectLink: validatePermissions("projectLink", "create"),
    updateProjectLink: validatePermissions("rowId", "update"),
    deleteProjectLink: validatePermissions("rowId", "delete"),
  },
});

export default ProjectLinkPlugin;
