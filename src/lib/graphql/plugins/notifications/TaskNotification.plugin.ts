import { EXPORTABLE } from "graphile-export";
import { context, sideEffect } from "postgraphile/grafast";
import { wrapPlans } from "postgraphile/utils";

import {
  notifyCommentCreated,
  notifyNewMentions,
  notifyTaskMoved,
} from "lib/notifications/taskActivity";

import type { PlanWrapperFn } from "postgraphile/utils";

/**
 * Task-activity email notifications (comments, @mentions, project moves).
 *
 * Each wrapper reads what it needs from the mutation input/result and hands off
 * to `lib/notifications/taskActivity`, which is best-effort and never throws.
 * The send is not awaited, so email latency never slows the mutation.
 *
 * Edits only notify people NEWLY mentioned, which needs the pre-mutation value.
 * A `sideEffect` created BEFORE `plan()` runs before the mutation (grafast makes
 * later steps implicitly depend on earlier side effects; the same ordering the
 * UserIdResolver relies on), so it reads the committed "before" state. All
 * notifications gate on the mutation result, so a rejected mutation (authz,
 * moderation, conflict) never emails anyone
 */

/** New comment: email mentioned users and everyone involved in the task */
const notifyOnCommentCreate = (): PlanWrapperFn =>
  EXPORTABLE(
    (context, sideEffect, notifyCommentCreated): PlanWrapperFn =>
      (plan, _, fieldArgs) => {
        const $result = plan();
        // a wrapped mutation always plans a step; narrow away grafast's nullable type
        if (!$result) return $result;
        const $input = fieldArgs.getRaw(["input", "post"]);
        const $observer = context().get("observer");
        const $organizations = context().get("organizations");
        const $db = context().get("db");

        sideEffect(
          [$result, $input, $observer, $organizations, $db],
          ([result, input, observer, organizations, db]) => {
            if (!result) return;
            const { taskId, description } = (input ?? {}) as {
              taskId?: string;
              description?: string | null;
            };
            if (!taskId) return;

            void notifyCommentCreated({
              db,
              actor: observer ? { id: observer.id, name: observer.name } : null,
              organizations,
              taskId,
              commentHtml: description ?? "",
            });
          },
        );

        return $result;
      },
    [context, sideEffect, notifyCommentCreated],
  );

/** New task: email anyone mentioned in its description */
const notifyOnTaskCreate = (): PlanWrapperFn =>
  EXPORTABLE(
    (context, sideEffect, notifyNewMentions): PlanWrapperFn =>
      (plan, _, fieldArgs) => {
        const $result = plan();
        // a wrapped mutation always plans a step; narrow away grafast's nullable type
        if (!$result) return $result;
        // the create payload wraps the inserted row; read its id via the step
        // (the payload's runtime value is an opaque tuple, not the row)
        // biome-ignore lint/suspicious/noExplicitAny: create payload object step
        const $taskId = ($result as any).get("result").get("id");
        const $input = fieldArgs.getRaw(["input", "task"]);
        const $observer = context().get("observer");
        const $organizations = context().get("organizations");
        const $db = context().get("db");

        sideEffect(
          [$taskId, $input, $observer, $organizations, $db],
          ([taskId, input, observer, organizations, db]) => {
            if (!taskId) return;
            const { description } = (input ?? {}) as {
              description?: string | null;
            };
            if (!description) return;

            void notifyNewMentions({
              db,
              actor: observer ? { id: observer.id, name: observer.name } : null,
              organizations,
              taskId: taskId as string,
              source: "description",
              before: null,
              after: description,
            });
          },
        );

        return $result;
      },
    [context, sideEffect, notifyNewMentions],
  );

/**
 * Task description or comment edited: email only people newly mentioned. The
 * "before" read runs ahead of the mutation and is skipped unless the patch
 * actually touches the description
 */
const notifyOnDescriptionEdit = (entity: "task" | "post"): PlanWrapperFn =>
  EXPORTABLE(
    (context, sideEffect, notifyNewMentions, entity): PlanWrapperFn =>
      (plan, _, fieldArgs) => {
        const $rowId = fieldArgs.getRaw(["input", "rowId"]);
        const $patch = fieldArgs.getRaw(["input", "patch"]);
        const $db = context().get("db");

        // capture the pre-mutation description (runs before plan's mutation)
        const $before = sideEffect(
          [$rowId, $patch, $db],
          async ([rowId, patch, db]) => {
            if (!rowId || !patch || !("description" in (patch as object))) {
              return null;
            }
            try {
              if (entity === "task") {
                const task = await db.query.tasks.findFirst({
                  where: (table, { eq }) => eq(table.id, rowId as string),
                  columns: { id: true, description: true },
                });
                return task
                  ? { taskId: task.id, description: task.description }
                  : null;
              }
              const post = await db.query.posts.findFirst({
                where: (table, { eq }) => eq(table.id, rowId as string),
                columns: { taskId: true, description: true },
              });
              return post
                ? { taskId: post.taskId, description: post.description }
                : null;
            } catch (error) {
              console.error(
                `[Notifications] Failed to read ${entity} before edit:`,
                error,
              );
              return null;
            }
          },
        );

        const $result = plan();

        // a wrapped mutation always plans a step; narrow away grafast's nullable type

        if (!$result) return $result;
        const $observer = context().get("observer");
        const $organizations = context().get("organizations");

        sideEffect(
          [$result, $before, $patch, $observer, $organizations, $db],
          ([result, before, patch, observer, organizations, db]) => {
            if (!result || !before) return;
            const after = (patch as { description?: string | null })
              .description;

            void notifyNewMentions({
              db,
              actor: observer ? { id: observer.id, name: observer.name } : null,
              organizations,
              taskId: before.taskId,
              source: entity === "task" ? "description" : "comment",
              before: before.description,
              after,
            });
          },
        );

        return $result;
      },
    [context, sideEffect, notifyNewMentions, entity],
  );

/** Task moved to another project: email its creator and assignees */
const notifyOnTaskMove = (): PlanWrapperFn =>
  EXPORTABLE(
    (context, sideEffect, notifyTaskMoved): PlanWrapperFn =>
      (plan, _, fieldArgs) => {
        const $input = fieldArgs.getRaw("input");
        const $db = context().get("db");

        // capture the source project and number before the move reassigns them
        const $before = sideEffect([$input, $db], async ([input, db]) => {
          const taskId = (input as { taskId?: string } | null)?.taskId;
          if (!taskId) return null;
          try {
            const task = await db.query.tasks.findFirst({
              where: (table, { eq }) => eq(table.id, taskId),
              columns: { projectId: true, number: true },
            });
            return task ?? null;
          } catch (error) {
            console.error(
              "[Notifications] Failed to read task before move:",
              error,
            );
            return null;
          }
        });

        const $result = plan();

        // a wrapped mutation always plans a step; narrow away grafast's nullable type

        if (!$result) return $result;
        const $observer = context().get("observer");
        const $organizations = context().get("organizations");

        sideEffect(
          [$result, $before, $observer, $organizations, $db],
          ([result, before, observer, organizations, db]) => {
            const taskId = (result as { id?: string } | null)?.id;
            if (!taskId || !before) return;

            void notifyTaskMoved({
              db,
              actor: observer ? { id: observer.id, name: observer.name } : null,
              organizations,
              taskId,
              fromProjectId: before.projectId,
              previousNumber: before.number,
            });
          },
        );

        return $result;
      },
    [context, sideEffect, notifyTaskMoved],
  );

/**
 * Task notification plugin.
 *
 * Emails people involved in a task about new comments and project moves, and
 * anyone @mentioned in a task description or comment. Fully noop for email
 * when Herald is unconfigured
 */
const TaskNotificationPlugin = wrapPlans({
  Mutation: {
    createPost: notifyOnCommentCreate(),
    updatePost: notifyOnDescriptionEdit("post"),
    createTask: notifyOnTaskCreate(),
    updateTask: notifyOnDescriptionEdit("task"),
    moveTask: notifyOnTaskMove(),
  },
});

export default TaskNotificationPlugin;
