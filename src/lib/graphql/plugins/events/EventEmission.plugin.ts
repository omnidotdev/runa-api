import { EXPORTABLE } from "graphile-export";
import { events } from "lib/providers";
import { context, sideEffect } from "postgraphile/grafast";
import { wrapPlans } from "postgraphile/utils";

import type { PlanWrapperFn } from "postgraphile/utils";

/**
 * Emit a domain event after a mutation succeeds.
 */
const emitOnMutate = (
  entity: string,
  action: "created" | "updated" | "deleted",
): PlanWrapperFn =>
  EXPORTABLE(
    (context, sideEffect, events, entity, action): PlanWrapperFn =>
      (plan, $record) => {
        const $observer = context().get("observer");

        sideEffect([$record, $observer], ([record, observer]) => {
          if (!record?.id) return;

          void events.emit({
            type: `runa.${entity}.${action}`,
            data: { id: record.id, actorId: observer?.id },
            subject: record.id,
          });
        });

        return plan();
      },
    [context, sideEffect, events, entity, action],
  );

/**
 * Event emission plugin for Runa mutations.
 *
 * Emits CloudEvents to Vortex for task, project, label, and post lifecycle.
 */
const EventEmissionPlugin = wrapPlans({
  Mutation: {
    createTask: emitOnMutate("task", "created"),
    updateTask: emitOnMutate("task", "updated"),
    deleteTask: emitOnMutate("task", "deleted"),
    createProject: emitOnMutate("project", "created"),
    updateProject: emitOnMutate("project", "updated"),
    deleteProject: emitOnMutate("project", "deleted"),
    createLabel: emitOnMutate("label", "created"),
    updateLabel: emitOnMutate("label", "updated"),
    deleteLabel: emitOnMutate("label", "deleted"),
    createPost: emitOnMutate("post", "created"),
    updatePost: emitOnMutate("post", "updated"),
    deletePost: emitOnMutate("post", "deleted"),
    createColumn: emitOnMutate("column", "created"),
    updateColumn: emitOnMutate("column", "updated"),
    deleteColumn: emitOnMutate("column", "deleted"),
  },
});

export default EventEmissionPlugin;
