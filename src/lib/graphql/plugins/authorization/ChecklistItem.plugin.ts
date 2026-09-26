import { EXPORTABLE } from "graphile-export";
import { context, sideEffect } from "postgraphile/grafast";
import { wrapPlans } from "postgraphile/utils";

import { checkPermission } from "lib/authz";

import type { InsertChecklistItem } from "lib/db/schema";
import type { PlanWrapperFn } from "postgraphile/utils";
import type { MutationScope } from "./types";

/**
 * Validate checklist item permissions via PDP.
 *
 * Resolves the owning project through checklist -> task and requires Editor
 * permission for create/update/delete (same level as editing a task)
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

            let projectId: string;

            if (scope === "create") {
              const checklistId = (input as InsertChecklistItem).checklistId;

              const checklist = await db.query.checklists.findFirst({
                where: (table, { eq }) => eq(table.id, checklistId),
                with: { task: { columns: { projectId: true } } },
              });
              if (!checklist) throw new Error("Checklist not found");
              projectId = checklist.task.projectId;
            } else {
              const item = await db.query.checklistItems.findFirst({
                where: (table, { eq }) => eq(table.id, input),
                with: {
                  checklist: {
                    with: { task: { columns: { projectId: true } } },
                  },
                },
              });
              if (!item) throw new Error("Checklist item not found");
              projectId = item.checklist.task.projectId;
            }

            const allowed = await checkPermission(
              observer.identityProviderId,
              "project",
              projectId,
              "editor",
              accessToken,
              authzCache,
            );
            if (!allowed) throw new Error("Unauthorized");
          },
        );

        return plan();
      },
    [context, sideEffect, checkPermission, propName, scope],
  );

/**
 * Authorization plugin for checklist items.
 *
 * Create/update/delete require Editor permission on the owning project.
 */
const ChecklistItemPlugin = wrapPlans({
  Mutation: {
    createChecklistItem: validatePermissions("checklistItem", "create"),
    updateChecklistItem: validatePermissions("rowId", "update"),
    deleteChecklistItem: validatePermissions("rowId", "delete"),
  },
});

export default ChecklistItemPlugin;
