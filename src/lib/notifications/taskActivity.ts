/**
 * Task-activity email notifications: new comments, @mentions, and moves to
 * another project.
 *
 * Called from the TaskNotification GraphQL plugin after a mutation succeeds.
 * Every entry point is best-effort: it loads what it needs from the given
 * connection, emails each recipient independently, logs failures, and never
 * throws, so a notification problem can never fail the user's mutation.
 * Delivery runs in-process through the notifications provider (Herald-backed,
 * a noop when unconfigured) so it works in the self-hosted stack too.
 *
 * Every recipient must still have access to the task's project at send time;
 * this guards against a crafted mention id or a stale assignee leaking task
 * content to someone outside the workspace
 */

import { eq, inArray } from "drizzle-orm";

import { checkPermission } from "lib/authz";
import { notificationPreferences, posts, users } from "lib/db/schema";
import {
  extractMentionIds,
  htmlToText,
  newlyMentionedIds,
} from "lib/notifications/mentions";
import {
  buildManageNotificationsLink,
  buildTaskKeySegment,
  buildTaskLink,
} from "lib/notifications/taskLink";
import {
  involvedUserIds,
  selectRecipients,
} from "lib/notifications/taskRecipients";
import {
  buildTaskCommentEmail,
  buildTaskMentionEmail,
  buildTaskMovedEmail,
} from "lib/notifications/templates/taskActivity";
import { notifications } from "lib/providers";

import type { EmailParams } from "@omnidotdev/providers";
import type { OrganizationClaim } from "lib/auth/organizations";
import type { dbPool } from "lib/db/db";
import type {
  RecipientCandidate,
  TaskEmailKind,
} from "lib/notifications/taskRecipients";
import type { EmailContent } from "lib/notifications/templates/layout";

type Db = typeof dbPool;

/** The user who performed the action */
interface Actor {
  id: string;
  name: string | null;
}

/** Shared inputs for every entry point */
interface NotifyContext {
  db: Db;
  actor: Actor | null;
  /** The actor's organization claims, used to resolve the workspace slug */
  organizations: OrganizationClaim[] | null | undefined;
}

/** The task as needed to address and render an email */
interface LoadedTask {
  id: string;
  content: string;
  number: number | null;
  authorId: string | null;
  assigneeIds: string[];
  project: {
    id: string;
    name: string;
    slug: string;
    prefix: string | null;
    organizationId: string;
  };
}

/** Links and labels every email for a task shares */
interface TaskEmailFields {
  taskTitle: string;
  taskDisplayKey: string;
  projectName: string;
  taskUrl: string | null;
  manageUrl: string | null;
}

/** How long to wait for a just-created task's row to become visible */
const TASK_VISIBILITY_RETRIES = 10;
const TASK_VISIBILITY_DELAY_MS = 300;

/**
 * Load a task, retrying briefly when it is not visible yet. Notifications run
 * on a separate connection without blocking the mutation, so a task created in
 * the same request may not be committed on the first read
 */
const loadTask = async (db: Db, taskId: string): Promise<LoadedTask | null> => {
  for (let attempt = 0; attempt < TASK_VISIBILITY_RETRIES; attempt++) {
    const task = await loadTaskOnce(db, taskId);
    if (task) return task;
    await new Promise((resolve) =>
      setTimeout(resolve, TASK_VISIBILITY_DELAY_MS),
    );
  }
  return null;
};

const loadTaskOnce = async (
  db: Db,
  taskId: string,
): Promise<LoadedTask | null> => {
  const task = await db.query.tasks.findFirst({
    where: (table, { eq }) => eq(table.id, taskId),
    columns: { id: true, content: true, number: true, authorId: true },
    with: {
      project: {
        columns: {
          id: true,
          name: true,
          slug: true,
          prefix: true,
          organizationId: true,
        },
      },
      assignees: { columns: { userId: true } },
    },
  });
  if (!task?.project) return null;

  return {
    id: task.id,
    content: task.content,
    number: task.number,
    authorId: task.authorId,
    assigneeIds: task.assignees.map((assignee) => assignee.userId),
    project: task.project,
  };
};

/** Load users (by local id or by IDP id) together with their preferences */
const loadCandidates = async (
  db: Db,
  by: { localIds?: string[]; idpIds?: string[] },
): Promise<RecipientCandidate[]> => {
  const localIds = by.localIds ?? [];
  const idpIds = by.idpIds ?? [];
  if (!localIds.length && !idpIds.length) return [];

  const rows = await db
    .select({
      id: users.id,
      identityProviderId: users.identityProviderId,
      email: users.email,
      name: users.name,
    })
    .from(users)
    .where(
      localIds.length
        ? inArray(users.id, localIds)
        : inArray(users.identityProviderId, idpIds),
    );
  if (!rows.length) return [];

  const preferences = await db
    .select({
      userId: notificationPreferences.userId,
      emailTaskComment: notificationPreferences.emailTaskComment,
      emailTaskMention: notificationPreferences.emailTaskMention,
      emailTaskMoved: notificationPreferences.emailTaskMoved,
    })
    .from(notificationPreferences)
    .where(
      inArray(
        notificationPreferences.userId,
        rows.map((row) => row.id),
      ),
    );
  const byUser = new Map(preferences.map((pref) => [pref.userId, pref]));

  return rows.map((row) => ({
    ...row,
    preference: byUser.get(row.id) ?? null,
  }));
};

/** Local ids of everyone who has commented on the task */
const loadCommenterIds = async (db: Db, taskId: string): Promise<string[]> => {
  const rows = await db
    .selectDistinct({ authorId: posts.authorId })
    .from(posts)
    .where(eq(posts.taskId, taskId));
  return rows.flatMap((row) => (row.authorId ? [row.authorId] : []));
};

/** Keep only recipients who can still see the task's project */
const withProjectAccess = async (
  recipients: RecipientCandidate[],
  projectId: string,
): Promise<RecipientCandidate[]> => {
  const checks = await Promise.all(
    recipients.map((recipient) =>
      checkPermission(
        recipient.identityProviderId,
        "project",
        projectId,
        "member",
        "",
      ).catch(() => false),
    ),
  );
  return recipients.filter((_, index) => checks[index]);
};

const taskEmailFields = (
  task: LoadedTask,
  organizations: OrganizationClaim[] | null | undefined,
): TaskEmailFields => {
  const workspaceSlug = organizations?.find(
    (org) => org.id === task.project.organizationId,
  )?.slug;
  const appBaseUrl = process.env.APP_BASE_URL;

  return {
    taskTitle: task.content,
    taskDisplayKey:
      task.number != null
        ? buildTaskKeySegment(task.project.prefix, task.number)
        : (task.project.prefix ?? ""),
    projectName: task.project.name,
    taskUrl:
      task.number != null
        ? buildTaskLink({
            appBaseUrl,
            workspaceSlug,
            projectSlug: task.project.slug,
            prefix: task.project.prefix,
            number: task.number,
          })
        : null,
    manageUrl: buildManageNotificationsLink({ appBaseUrl, workspaceSlug }),
  };
};

/** Email each recipient independently; one failure never blocks the rest */
const sendToEach = async (
  kind: TaskEmailKind,
  recipients: RecipientCandidate[],
  content: EmailContent,
  manageUrl: string | null,
): Promise<void> => {
  const results = await Promise.allSettled(
    recipients.map((recipient) => {
      const params: EmailParams = {
        // filtered by selectRecipients, so email is a deliverable address
        to: recipient.email as string,
        subject: content.subject,
        body: content.html,
        html: true,
      };
      if (manageUrl) params.headers = { "List-Unsubscribe": `<${manageUrl}>` };
      return notifications.sendEmail(params);
    }),
  );

  for (const result of results) {
    if (result.status === "rejected") {
      console.error(
        `[Notifications] Failed to send task ${kind} email:`,
        result.reason,
      );
    }
  }
};

/**
 * Email newly mentioned users. Returns the local ids of everyone mentioned (not
 * only those emailed) so a comment email can skip them
 */
const notifyMentions = async (
  { db, actor }: NotifyContext,
  task: LoadedTask,
  fields: TaskEmailFields,
  mentionedIdpIds: string[],
  source: "comment" | "description",
  contentHtml: string,
): Promise<string[]> => {
  if (!mentionedIdpIds.length) return [];

  const mentioned = await loadCandidates(db, { idpIds: mentionedIdpIds });
  const recipients = await withProjectAccess(
    selectRecipients({
      candidates: mentioned,
      kind: "mention",
      actorId: actor?.id,
    }),
    task.project.id,
  );

  if (recipients.length) {
    const content = buildTaskMentionEmail({
      ...fields,
      actorName: actor?.name,
      source,
      contentText: htmlToText(contentHtml),
    });
    await sendToEach("mention", recipients, content, fields.manageUrl);
  }

  return mentioned.map((candidate) => candidate.id);
};

/**
 * A comment was posted: email anyone newly @mentioned in it, then everyone else
 * involved in the task (creator, assignees, prior commenters)
 */
export const notifyCommentCreated = async (
  ctx: NotifyContext & { taskId: string; commentHtml: string },
): Promise<void> => {
  try {
    const task = await loadTask(ctx.db, ctx.taskId);
    if (!task) return;
    const fields = taskEmailFields(task, ctx.organizations);

    const mentionedIds = await notifyMentions(
      ctx,
      task,
      fields,
      extractMentionIds(ctx.commentHtml),
      "comment",
      ctx.commentHtml,
    );

    const involved = involvedUserIds({
      authorId: task.authorId,
      assigneeIds: task.assigneeIds,
      commenterIds: await loadCommenterIds(ctx.db, task.id),
    });
    const candidates = await loadCandidates(ctx.db, { localIds: involved });
    const recipients = await withProjectAccess(
      selectRecipients({
        candidates,
        kind: "comment",
        actorId: ctx.actor?.id,
        excludeIds: mentionedIds,
      }),
      task.project.id,
    );
    if (!recipients.length) return;

    const content = buildTaskCommentEmail({
      ...fields,
      actorName: ctx.actor?.name,
      commentText: htmlToText(ctx.commentHtml),
    });
    await sendToEach("comment", recipients, content, fields.manageUrl);
  } catch (error) {
    console.error("[Notifications] Failed to notify comment:", error);
  }
};

/**
 * A task description or an existing comment was written or edited: email only
 * the people mentioned in `after` who were not already mentioned in `before`
 */
export const notifyNewMentions = async (
  ctx: NotifyContext & {
    taskId: string;
    source: "comment" | "description";
    before: string | null | undefined;
    after: string | null | undefined;
  },
): Promise<void> => {
  try {
    const mentionedIdpIds = newlyMentionedIds(ctx.before, ctx.after);
    if (!mentionedIdpIds.length) return;

    const task = await loadTask(ctx.db, ctx.taskId);
    if (!task) return;

    await notifyMentions(
      ctx,
      task,
      taskEmailFields(task, ctx.organizations),
      mentionedIdpIds,
      ctx.source,
      ctx.after ?? "",
    );
  } catch (error) {
    console.error("[Notifications] Failed to notify mentions:", error);
  }
};

/**
 * A task moved to another project: email its creator and assignees. Commenters
 * are left out on purpose; a move matters to the people who own the work
 */
export const notifyTaskMoved = async (
  ctx: NotifyContext & {
    taskId: string;
    fromProjectId: string;
    previousNumber: number | null;
  },
): Promise<void> => {
  try {
    const task = await loadTask(ctx.db, ctx.taskId);
    if (!task || task.project.id === ctx.fromProjectId) return;

    const fromProject = await ctx.db.query.projects.findFirst({
      where: (table, { eq }) => eq(table.id, ctx.fromProjectId),
      columns: { name: true, prefix: true },
    });

    const candidates = await loadCandidates(ctx.db, {
      localIds: involvedUserIds({
        authorId: task.authorId,
        assigneeIds: task.assigneeIds,
        commenterIds: [],
      }),
    });
    const recipients = await withProjectAccess(
      selectRecipients({ candidates, kind: "moved", actorId: ctx.actor?.id }),
      task.project.id,
    );
    if (!recipients.length) return;

    const fields = taskEmailFields(task, ctx.organizations);
    const content = buildTaskMovedEmail({
      ...fields,
      actorName: ctx.actor?.name,
      previousDisplayKey:
        ctx.previousNumber != null
          ? buildTaskKeySegment(fromProject?.prefix ?? null, ctx.previousNumber)
          : fields.taskDisplayKey,
      fromProjectName: fromProject?.name ?? "another project",
    });
    await sendToEach("moved", recipients, content, fields.manageUrl);
  } catch (error) {
    console.error("[Notifications] Failed to notify task move:", error);
  }
};
