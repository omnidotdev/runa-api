import { EXPORTABLE } from "graphile-export";
import { constant, context, sideEffect } from "postgraphile/grafast";
import { wrapPlans } from "postgraphile/utils";

import { buildAssocChange } from "lib/events/assocChanges";
import {
  buildResourceEvent,
  resourceEventWith,
} from "lib/events/resourceEvent";
import { buildTaskChanges } from "lib/events/taskChanges";
import { events } from "lib/providers";

import type { OrgVia } from "lib/events/resourceEvent";
import type { PlanWrapperFn } from "postgraphile/utils";

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
      buildResourceEvent,
      resourceEventWith,
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
                with: resourceEventWith(orgVia),
              });

              await events.emit(
                buildResourceEvent(
                  { entity, action, nameColumn, orgVia },
                  id,
                  row,
                  observer,
                ),
              );
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
      buildResourceEvent,
      resourceEventWith,
      entity,
      action,
      table,
      nameColumn,
      orgVia,
    ],
  );

/**
 * Emit a task update event enriched with the specific fields that changed, so the
 * activity feed can render "moved this task to Done" / "set priority to High"
 * rather than a useless "updated". Reads the mutation `patch` for the changed
 * fields and resolves a columnId change into the destination column's title
 */
const emitTaskUpdated = (): PlanWrapperFn =>
  EXPORTABLE(
    (
      context,
      sideEffect,
      events,
      buildResourceEvent,
      resourceEventWith,
      buildTaskChanges,
    ): PlanWrapperFn =>
      (plan, _, fieldArgs) => {
        const $result = plan();
        const $rowId = fieldArgs.getRaw(["input", "rowId"]);
        const $patch = fieldArgs.getRaw(["input", "patch"]);
        const $observer = context().get("observer");
        const $db = context().get("db");

        sideEffect(
          [$result, $rowId, $patch, $observer, $db],
          async ([result, rowId, patch, observer, db]) => {
            const id =
              (result as { id?: string } | null)?.id ??
              (rowId as string | undefined);
            if (!id) return;

            try {
              const row = await db.query.tasks.findFirst({
                // biome-ignore lint/suspicious/noExplicitAny: drizzle where callback
                where: (fields: any, operators: any) =>
                  operators.eq(fields.id, id),
                with: resourceEventWith("project"),
              });

              const patchObj = (patch ?? {}) as Record<string, unknown>;
              let columnTitle: string | null = null;
              if ("columnId" in patchObj && patchObj.columnId) {
                const column = await db.query.columns.findFirst({
                  // biome-ignore lint/suspicious/noExplicitAny: drizzle where callback
                  where: (fields: any, operators: any) =>
                    operators.eq(fields.id, patchObj.columnId),
                  columns: { title: true },
                });
                columnTitle = column?.title ?? null;
              }

              await events.emit(
                buildResourceEvent(
                  {
                    entity: "task",
                    action: "updated",
                    nameColumn: "number",
                    orgVia: "project",
                  },
                  id,
                  row,
                  observer,
                  buildTaskChanges(patchObj, columnTitle),
                ),
              );
            } catch (error) {
              console.error("[Events] Failed to emit task.updated:", error);
            }
          },
        );

        return $result;
      },
    [
      context,
      sideEffect,
      events,
      buildResourceEvent,
      resourceEventWith,
      buildTaskChanges,
    ],
  );

/**
 * Emit a task-scoped activity event for a change to one of a task's associated
 * records (an assignee or a label). The event's `subject` is the OWNING TASK's
 * id (not the join row), so the per-task activity feed (Chronicle
 * `resourceActivity` keyed by task id) surfaces "assigned Alice" / "added the
 * Bug label" alongside the task's own field changes - a unified timeline like
 * the market trackers. Both the task id and the associated record's id come
 * straight from the mutation input; the record's display name is resolved for
 * the change phrase (falling back to a generic verb when it can't be resolved).
 */
const emitTaskAssoc = (
  entity: "assignee" | "task_label",
  action: "created" | "deleted",
  taskIdPath: string[],
  assocIdPath: string[],
  assocTable: "users" | "labels",
): PlanWrapperFn =>
  EXPORTABLE(
    (
      context,
      sideEffect,
      events,
      buildResourceEvent,
      resourceEventWith,
      buildAssocChange,
      entity,
      action,
      taskIdPath,
      assocIdPath,
      assocTable,
    ): PlanWrapperFn =>
      (plan, _, fieldArgs) => {
        const $result = plan();
        const $taskId = fieldArgs.getRaw(taskIdPath);
        const $assocId = fieldArgs.getRaw(assocIdPath);
        const $observer = context().get("observer");
        const $db = context().get("db");

        sideEffect(
          [$result, $taskId, $assocId, $observer, $db],
          async ([, taskId, assocId, observer, db]) => {
            if (!taskId) return;

            try {
              const row = await db.query.tasks.findFirst({
                // biome-ignore lint/suspicious/noExplicitAny: drizzle where callback
                where: (fields: any, operators: any) =>
                  operators.eq(fields.id, taskId),
                with: resourceEventWith("project"),
              });

              // biome-ignore lint/suspicious/noExplicitAny: relational lookup keyed by table name
              const assocRepo = (db as any).query[assocTable];
              const assoc =
                assocId && assocRepo
                  ? await assocRepo.findFirst({
                      // biome-ignore lint/suspicious/noExplicitAny: drizzle where callback
                      where: (fields: any, operators: any) =>
                        operators.eq(fields.id, assocId),
                      columns: { name: true },
                    })
                  : null;
              const name = (assoc?.name as string | undefined) ?? null;

              await events.emit(
                buildResourceEvent(
                  { entity, action, nameColumn: null, orgVia: "project" },
                  taskId as string,
                  row,
                  observer,
                  buildAssocChange(entity, action, name),
                ),
              );
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
      context,
      sideEffect,
      events,
      buildResourceEvent,
      resourceEventWith,
      buildAssocChange,
      entity,
      action,
      taskIdPath,
      assocIdPath,
      assocTable,
    ],
  );

/**
 * Emit a task-scoped activity event for a comment (post) lifecycle change. Like
 * `emitTaskAssoc`, the event's `subject` is the OWNING TASK's id so comments
 * appear in the task's unified activity feed ("commented"). The task id is
 * resolved from the post row rather than the input, since updates and deletes
 * only carry the post's own id; a fresh connection sees the row even for a
 * delete (the request transaction has not committed yet).
 */
const emitPostActivity = (
  action: "created" | "updated" | "deleted",
): PlanWrapperFn =>
  EXPORTABLE(
    (
      constant,
      context,
      sideEffect,
      events,
      buildResourceEvent,
      resourceEventWith,
      action,
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
              const post = await db.query.posts.findFirst({
                // biome-ignore lint/suspicious/noExplicitAny: drizzle where callback
                where: (fields: any, operators: any) =>
                  operators.eq(fields.id, id),
                with: resourceEventWith("task"),
              });
              const taskId = (post as { taskId?: string } | null)?.taskId;
              if (!taskId) return;

              await events.emit(
                buildResourceEvent(
                  { entity: "post", action, nameColumn: null, orgVia: "task" },
                  taskId,
                  post,
                  observer,
                ),
              );
            } catch (error) {
              console.error(`[Events] Failed to emit post.${action}:`, error);
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
      buildResourceEvent,
      resourceEventWith,
      action,
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
    updateTask: emitTaskUpdated(),
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
    // Comments, assignees, and labels are emitted TASK-SCOPED (subject = task
    // id) so they land in the per-task activity feed alongside field changes,
    // giving a unified timeline (comment / assigned / labeled), not just edits.
    createPost: emitPostActivity("created"),
    updatePost: emitPostActivity("updated"),
    deletePost: emitPostActivity("deleted"),
    createAssignee: emitTaskAssoc(
      "assignee",
      "created",
      ["input", "assignee", "taskId"],
      ["input", "assignee", "userId"],
      "users",
    ),
    deleteAssignee: emitTaskAssoc(
      "assignee",
      "deleted",
      ["input", "taskId"],
      ["input", "userId"],
      "users",
    ),
    createTaskLabel: emitTaskAssoc(
      "task_label",
      "created",
      ["input", "taskLabel", "taskId"],
      ["input", "taskLabel", "labelId"],
      "labels",
    ),
    deleteTaskLabel: emitTaskAssoc(
      "task_label",
      "deleted",
      ["input", "taskId"],
      ["input", "labelId"],
      "labels",
    ),
  },
});

export default EventEmissionPlugin;
