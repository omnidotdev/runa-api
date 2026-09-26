import { EXPORTABLE } from "graphile-export";
import { context, sideEffect } from "postgraphile/grafast";
import { wrapPlans } from "postgraphile/utils";

import { checkPermission } from "lib/authz";

import type { InsertChecklist } from "lib/db/schema";
import type { PlanWrapperFn } from "postgraphile/utils";
import type { MutationScope } from "./types";

/**
 * Validate checklist permissions via PDP.
 *
 * Checklists are structural task content, so create/update/delete all require
 * Editor permission on the owning project (same level as editing a task)
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
              const taskId = (input as InsertChecklist).taskId;

              const task = await db.query.tasks.findFirst({
                where: (table, { eq }) => eq(table.id, taskId),
                columns: { projectId: true },
              });
              if (!task) throw new Error("Task not found");
              projectId = task.projectId;
            } else {
              const checklist = await db.query.checklists.findFirst({
                where: (table, { eq }) => eq(table.id, input),
                with: { task: { columns: { projectId: true } } },
              });
              if (!checklist) throw new Error("Checklist not found");
              projectId = checklist.task.projectId;
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
 * Authorization plugin for checklists.
 *
 * Create/update/delete require Editor permission on the owning project.
 */
const ChecklistPlugin = wrapPlans({
  Mutation: {
    createChecklist: validatePermissions("checklist", "create"),
    updateChecklist: validatePermissions("rowId", "update"),
    deleteChecklist: validatePermissions("rowId", "delete"),
  },
});

export default ChecklistPlugin;
