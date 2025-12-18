import { EXPORTABLE } from "graphile-export";
import { context, sideEffect } from "postgraphile/grafast";
import { wrapPlans } from "postgraphile/utils";

import { BASIC_TIER_MAX_LABELS, FREE_TIER_MAX_LABELS } from "./constants";

import type { InsertLabel } from "lib/db/schema";
import type { PlanWrapperFn } from "postgraphile/utils";
import type { MutationScope } from "./types";

const validatePermissions = (propName: string, scope: MutationScope) =>
  EXPORTABLE(
    (
      context,
      sideEffect,
      propName,
      scope,
      FREE_TIER_MAX_LABELS,
      BASIC_TIER_MAX_LABELS,
    ): PlanWrapperFn =>
      (plan, _, fieldArgs) => {
        const $input = fieldArgs.getRaw(["input", propName]);
        const $observer = context().get("observer");
        const $db = context().get("db");

        sideEffect([$input, $observer, $db], async ([input, observer, db]) => {
          if (!observer) throw new Error("Unauthorized");

          if (scope !== "create") {
            const label = await db.query.labelTable.findFirst({
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

            if (!label?.project.workspace.workspaceUsers.length)
              throw new Error("Unauthorized");

            if (label.project.workspace.workspaceUsers[0].role === "member")
              throw new Error("Unauthorized");
          } else {
            const projectId = (input as InsertLabel).projectId;

            const project = await db.query.projectTable.findFirst({
              where: (table, { eq }) => eq(table.id, projectId),
              with: {
                labels: true,
                workspace: {
                  with: {
                    workspaceUsers: {
                      where: (table, { eq }) => eq(table.userId, observer.id),
                    },
                  },
                },
              },
            });

            if (!project?.workspace.workspaceUsers.length)
              throw new Error("Unauthorized");

            if (project.workspace.workspaceUsers[0].role === "member")
              throw new Error("Unauthorized");

            if (
              project.workspace.tier === "free" &&
              project.labels.length >= FREE_TIER_MAX_LABELS
            )
              throw new Error("Maximum number of labels reached");

            if (
              project.workspace.tier === "basic" &&
              project.labels.length >= BASIC_TIER_MAX_LABELS
            )
              throw new Error("Maximum number of labels reached");
          }
        });

        return plan();
      },
    [
      context,
      sideEffect,
      propName,
      scope,
      FREE_TIER_MAX_LABELS,
      BASIC_TIER_MAX_LABELS,
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
