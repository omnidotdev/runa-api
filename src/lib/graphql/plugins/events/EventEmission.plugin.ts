import { EXPORTABLE } from "graphile-export";
import { constant, context, sideEffect } from "postgraphile/grafast";
import { wrapPlans } from "postgraphile/utils";

import { eventMeta } from "lib/events/enrich";
import { events } from "lib/providers";

import type { PlanWrapperFn } from "postgraphile/utils";

/** How to reach the owning organization id from a mutated row. */
type OrgVia = "direct" | "project" | "task";

/**
 * Emit an enriched CloudEvent after a Runa mutation succeeds.
 *
 * The mutation result is captured via `plan()`; the second `wrapPlans` argument
 * is the parent step, not the result, so reading the new row's id from it
 * silently no-ops. The resource name and owning organization are resolved from a
 * fresh connection (which sees committed state, so deletes still resolve before
 * the request transaction commits), and the payload is enriched with actor and
 * resource metadata so audit/activity-feed consumers (e.g. Chronicle) get
 * who-did-what-to-which-thing without extra lookups.
 *
 * `input.rowId` is only read for updates and deletes; `getRaw` throws on a
 * missing input field, so creates derive the id from the result alone. Failures
 * are logged but never fail the mutation (eventual consistency).
 */
const emitOnMutate = (
  entity: string,
  action: "created" | "updated" | "deleted",
  table: string,
  nameColumn: string | null,
  orgVia: OrgVia,
): PlanWrapperFn =>
  EXPORTABLE(
    (
      constant,
      context,
      sideEffect,
      events,
      eventMeta,
      entity,
      action,
      table,
      nameColumn,
      orgVia,
    ): PlanWrapperFn =>
      (plan, _, fieldArgs) => {
        const $result = plan();
        const $rowId =
          action === "created"
            ? constant(undefined)
            : fieldArgs.getRaw(["input", "rowId"]);
        const $observer = context().get("observer");
        const $db = context().get("db");

        sideEffect(
          [$result, $rowId, $observer, $db],
          async ([result, rowId, observer, db]) => {
            const id =
              (result as { id?: string } | null)?.id ??
              (rowId as string | undefined);
            if (!id) return;

            try {
              // biome-ignore lint/suspicious/noExplicitAny: relational lookup keyed by table name
              const repo = (db as any).query[table];
              if (!repo) return;

              const row = await repo.findFirst({
                // biome-ignore lint/suspicious/noExplicitAny: drizzle where callback
                where: (fields: any, operators: any) =>
                  operators.eq(fields.id, id),
                with:
                  orgVia === "project"
                    ? { project: { columns: { organizationId: true } } }
                    : orgVia === "task"
                      ? {
                          task: {
                            with: {
                              project: { columns: { organizationId: true } },
                            },
                          },
                        }
                      : undefined,
              });

              const rawName = nameColumn ? row?.[nameColumn] : null;
              const resourceName = rawName != null ? String(rawName) : null;

              const organizationId: string | undefined =
                orgVia === "direct"
                  ? row?.organizationId
                  : orgVia === "project"
                    ? row?.project?.organizationId
                    : row?.task?.project?.organizationId;

              await events.emit({
                type: `runa.${entity}.${action}`,
                data: {
                  id,
                  ...(organizationId ? { organizationId } : {}),
                  ...eventMeta(observer, entity, resourceName),
                },
                ...(organizationId ? { organizationId } : {}),
                subject: id,
              });
            } catch (error) {
              console.error(
                `[Events] Failed to emit ${entity}.${action}:`,
                error,
              );
            }
          },
        );

        return $result;
      },
    [
      constant,
      context,
      sideEffect,
      events,
      eventMeta,
      entity,
      action,
      table,
      nameColumn,
      orgVia,
    ],
  );

/**
 * Event emission plugin for Runa mutations.
 *
 * Emits enriched CloudEvents to Vortex for task, project, label, column, and
 * post lifecycle, carrying actor + resource metadata for Chronicle and other
 * audit/activity-feed consumers.
 */
const EventEmissionPlugin = wrapPlans({
  Mutation: {
    createTask: emitOnMutate("task", "created", "tasks", "number", "project"),
    updateTask: emitOnMutate("task", "updated", "tasks", "number", "project"),
    deleteTask: emitOnMutate("task", "deleted", "tasks", "number", "project"),
    createProject: emitOnMutate(
      "project",
      "created",
      "projects",
      "name",
      "direct",
    ),
    updateProject: emitOnMutate(
      "project",
      "updated",
      "projects",
      "name",
      "direct",
    ),
    deleteProject: emitOnMutate(
      "project",
      "deleted",
      "projects",
      "name",
      "direct",
    ),
    createLabel: emitOnMutate("label", "created", "labels", "name", "direct"),
    updateLabel: emitOnMutate("label", "updated", "labels", "name", "direct"),
    deleteLabel: emitOnMutate("label", "deleted", "labels", "name", "direct"),
    createColumn: emitOnMutate(
      "column",
      "created",
      "columns",
      "title",
      "project",
    ),
    updateColumn: emitOnMutate(
      "column",
      "updated",
      "columns",
      "title",
      "project",
    ),
    deleteColumn: emitOnMutate(
      "column",
      "deleted",
      "columns",
      "title",
      "project",
    ),
    createPost: emitOnMutate("post", "created", "posts", "title", "task"),
    updatePost: emitOnMutate("post", "updated", "posts", "title", "task"),
    deletePost: emitOnMutate("post", "deleted", "posts", "title", "task"),
  },
});

export default EventEmissionPlugin;
