/**
 * Runa-branded emails for task activity: a new comment, an @mention, and a move
 * to another project. Same shell and palette as the assignment email. Pure
 * content only: returns `{ subject, html }`
 */

import { cleanTitle, cta, escapeHtml, layout } from "./layout";

import type { EmailContent } from "./layout";

/** Fields every task-activity email shares */
interface TaskEmailBase {
  /** Display name of the person who acted, if known */
  actorName?: string | null;
  /** Raw task title (task.content); escaped and truncated internally */
  taskTitle: string;
  /** Display key, e.g. "API-42" */
  taskDisplayKey: string;
  /** Project name */
  projectName: string;
  /** Deep link to the task, or null when it cannot be built */
  taskUrl: string | null;
  /** Link to notification settings, or null */
  manageUrl: string | null;
}

/** Max characters of comment/description text quoted in an email */
const EXCERPT_LENGTH = 300;

/** The task key + title line shown under the lead sentence */
const taskLine = (key: string, title: string): string =>
  `<p style="font-size:15px;line-height:24px;text-align:center;color:#111827">
      <span style="color:#6b7280">${escapeHtml(key)}</span>&nbsp;&nbsp;${escapeHtml(cleanTitle(title))}
    </p>`;

/** A quoted excerpt block, omitted when there is no text */
const quote = (text: string): string => {
  const excerpt = cleanTitle(text, EXCERPT_LENGTH);
  if (!excerpt) return "";
  return `<blockquote style="margin:16px 0;padding:12px 16px;border-left:3px solid #e5e7eb;background:#f9fafb;font-size:14px;line-height:22px;color:#374151">${escapeHtml(excerpt)}</blockquote>`;
};

/**
 * Subject header text: whitespace (incl. CR/LF from user-controlled names) is
 * collapsed so a name can never break the header, then length-capped
 */
const subjectLine = (value: string): string => cleanTitle(value, 200);

const actorOr = (actorName: string | null | undefined, fallback: string) =>
  actorName?.trim() || fallback;

interface TaskCommentEmailParams extends TaskEmailBase {
  /** Plain-text comment body (already stripped of markup) */
  commentText: string;
}

/** Email someone involved in a task that a new comment was posted */
export const buildTaskCommentEmail = ({
  actorName,
  taskTitle,
  taskDisplayKey,
  projectName,
  taskUrl,
  manageUrl,
  commentText,
}: TaskCommentEmailParams): EmailContent => {
  const actor = actorOr(actorName, "Someone");

  const html = layout(
    "New comment on a task",
    `<p style="font-size:14px;line-height:24px;text-align:center"><strong>${escapeHtml(actor)}</strong> commented on a task in <strong>${escapeHtml(projectName)}</strong>.</p>
    ${taskLine(taskDisplayKey, taskTitle)}
    ${quote(commentText)}
    ${cta(taskUrl, "View comment")}`,
    manageUrl,
    "involved",
  );

  return {
    subject: subjectLine(`${actor} commented on ${taskDisplayKey}`),
    html,
  };
};

interface TaskMentionEmailParams extends TaskEmailBase {
  /** Where the mention appeared */
  source: "comment" | "description";
  /** Plain-text body of the comment/description that holds the mention */
  contentText: string;
}

/** Email someone that they were @mentioned in a comment or task description */
export const buildTaskMentionEmail = ({
  actorName,
  taskTitle,
  taskDisplayKey,
  projectName,
  taskUrl,
  manageUrl,
  source,
  contentText,
}: TaskMentionEmailParams): EmailContent => {
  const actor = actorOr(actorName, "Someone");
  const where =
    source === "comment" ? "a comment on a task" : "a task description";

  const html = layout(
    "You were mentioned",
    `<p style="font-size:14px;line-height:24px;text-align:center"><strong>${escapeHtml(actor)}</strong> mentioned you in ${where} in <strong>${escapeHtml(projectName)}</strong>.</p>
    ${taskLine(taskDisplayKey, taskTitle)}
    ${quote(contentText)}
    ${cta(taskUrl, "View task")}`,
    manageUrl,
    "mentioned",
  );

  return {
    subject: subjectLine(`${actor} mentioned you in ${taskDisplayKey}`),
    html,
  };
};

interface TaskMovedEmailParams extends TaskEmailBase {
  /** The task's key before the move, e.g. "WEB-3" */
  previousDisplayKey: string;
  /** Name of the project the task moved out of */
  fromProjectName: string;
}

/**
 * Email someone involved in a task that it moved to another project. A move
 * reassigns the task's key, so both the old and new keys are shown
 */
export const buildTaskMovedEmail = ({
  actorName,
  taskTitle,
  taskDisplayKey,
  projectName,
  taskUrl,
  manageUrl,
  previousDisplayKey,
  fromProjectName,
}: TaskMovedEmailParams): EmailContent => {
  const actor = actorOr(actorName, "Someone");

  const html = layout(
    "A task was moved",
    `<p style="font-size:14px;line-height:24px;text-align:center"><strong>${escapeHtml(actor)}</strong> moved <strong>${escapeHtml(previousDisplayKey)}</strong> from <strong>${escapeHtml(fromProjectName)}</strong> to <strong>${escapeHtml(projectName)}</strong>. It is now <strong>${escapeHtml(taskDisplayKey)}</strong>.</p>
    ${taskLine(taskDisplayKey, taskTitle)}
    ${cta(taskUrl, "View task")}`,
    manageUrl,
    "involved",
  );

  return {
    subject: subjectLine(
      `${actor} moved ${previousDisplayKey} to ${projectName}`,
    ),
    html,
  };
};
