import { EXPORTABLE } from "graphile-export";
import { context, sideEffect } from "postgraphile/grafast";
import { wrapPlans } from "postgraphile/utils";

import { buildResourceEvent } from "lib/events/resourceEvent";
import { resolveAssignmentEmail } from "lib/notifications/assignmentEmail";
import { events, notifications } from "lib/providers";

import type { InsertAssignee } from "lib/db/schema";
import type { PlanWrapperFn } from "postgraphile/utils";

/**
 * Send a task-assignment email (and emit a `runa.assignee.created` CloudEvent)
 * after a `createAssignee` mutation succeeds.
 *
 * `createAssignee` is an auto-generated mutation; the assignee row uses a
 * composite key (taskId, userId) with no `id` column, so the generic
 * `emitOnMutate` helper cannot be reused. The assignee identity is read from the
 * mutation input (the same shape the authorization plugin reads), and all the
 * data the email needs is loaded from a fresh connection in the side effect.
 *
 * Email delivery runs in-process (not via Vortex) so it works in the
 * self-hosted stack where Vortex is absent; the notifications provider is a noop
 * and returns without throwing when Herald is unconfigured. The workspace slug
 * for the task link is resolved from the request's organization claims. Email
 * and event emission are independent and best-effort: either failing is logged
 * and never fails the mutation (eventual consistency)
 */
const notifyOnAssign = (): PlanWrapperFn =>
  EXPORTABLE(
    (
      context,
      sideEffect,
      buildResourceEvent,
      resolveAssignmentEmail,
      events,
      notifications,
    ): PlanWrapperFn =>
      (plan, _, fieldArgs) => {
        const $result = plan();
        const $input = fieldArgs.getRaw(["input", "assignee"]);
        const $observer = context().get("observer");
        const $organizations = context().get("organizations");
        const $db = context().get("db");

        sideEffect(
          [$result, $input, $observer, $organizations, $db],
          async ([result, input, observer, organizations, db]) => {
            // only notify when the assignee row was actually inserted; keying
            // off the input alone would fire even when the mutation was rejected
            // (authorization failure, duplicate-assignee conflict)
            if (!result) return;

            const { taskId, userId } = (input ?? {}) as Partial<InsertAssignee>;
            if (!taskId || !userId) return;

            try {
              const task = await db.query.tasks.findFirst({
                where: (table, { eq }) => eq(table.id, taskId),
                with: { project: true },
              });
              if (!task?.project) return;

              const workspaceSlug = organizations?.find(
                (org) => org.id === task.project.organizationId,
              )?.slug;

              // task-assignment email (best effort, independent of the event)
              try {
                const assignee = await db.query.users.findFirst({
                  where: (table, { eq }) => eq(table.id, userId),
                  columns: { id: true, email: true, name: true },
                });
                const preference =
                  await db.query.notificationPreferences.findFirst({
                    where: (table, { eq }) => eq(table.userId, userId),
                    columns: { emailTaskAssigned: true },
                  });

                const email = resolveAssignmentEmail({
                  assignee: assignee ?? null,
                  assigner: observer
                    ? { id: observer.id, name: observer.name }
                    : null,
                  task: { content: task.content, number: task.number },
                  project: {
                    name: task.project.name,
                    slug: task.project.slug,
                    prefix: task.project.prefix,
                    organizationId: task.project.organizationId,
                  },
                  preference: preference ?? null,
                  workspaceSlug,
                  appBaseUrl: process.env.APP_BASE_URL,
                });

                if (email) await notifications.sendEmail(email);
              } catch (error) {
                console.error(
                  "[Notifications] Failed to send assignment email:",
                  error,
                );
              }

              // ecosystem observability event (best effort)
              try {
                await events.emit(
                  buildResourceEvent(
                    {
                      entity: "assignee",
                      action: "created",
                      nameColumn: null,
                      orgVia: "task",
                    },
                    `${taskId}:${userId}`,
                    { task },
                    observer,
                  ),
                );
              } catch (error) {
                console.error(
                  "[Events] Failed to emit assignee.created:",
                  error,
                );
              }
            } catch (error) {
              console.error(
                "[Notifications] Failed to load assignment context:",
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
      buildResourceEvent,
      resolveAssignmentEmail,
      events,
      notifications,
    ],
  );

/**
 * Assignment notification plugin.
 *
 * Emails the assignee and emits `runa.assignee.created` when a user is assigned
 * to a task. Fully noop for email when Herald is unconfigured
 */
const AssignmentNotificationPlugin = wrapPlans({
  Mutation: {
    createAssignee: notifyOnAssign(),
  },
});

export default AssignmentNotificationPlugin;
