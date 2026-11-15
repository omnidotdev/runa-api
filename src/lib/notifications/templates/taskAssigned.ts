/**
 * Runa-branded task-assignment email content. Mirrors the shared billing-email
 * style (a `layout` shell plus a `cta` button) but with Runa's palette and moon
 * mark. Pure content only: returns `{ subject, html }`; delivery is the caller's
 * job (the notifications provider / Herald)
 */

import { cleanTitle, cta, escapeHtml, layout } from "./layout";

import type { EmailContent } from "./layout";

interface TaskAssignedEmailParams {
  /** Display name of the person who made the assignment, if known */
  assignerName?: string | null;
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

/**
 * Build the task-assignment email. The subject names who assigned the task and
 * its key; the body names the project and links to the task
 */
export const buildTaskAssignedEmail = ({
  assignerName,
  taskTitle,
  taskDisplayKey,
  projectName,
  taskUrl,
  manageUrl,
}: TaskAssignedEmailParams): EmailContent => {
  const title = cleanTitle(taskTitle);
  const safeTitle = escapeHtml(title);
  const safeKey = escapeHtml(taskDisplayKey);
  const safeProject = escapeHtml(projectName);
  const safeAssigner = assignerName ? escapeHtml(assignerName.trim()) : null;

  const subject = safeAssigner
    ? `${assignerName?.trim()} assigned you ${taskDisplayKey}`
    : `You were assigned ${taskDisplayKey}`;

  const lead = safeAssigner
    ? `<strong>${safeAssigner}</strong> assigned you a task in <strong>${safeProject}</strong>.`
    : `You were assigned a task in <strong>${safeProject}</strong>.`;

  const html = layout(
    "You've been assigned a task",
    `<p style="font-size:14px;line-height:24px;text-align:center">${lead}</p>
    <p style="font-size:15px;line-height:24px;text-align:center;color:#111827">
      <span style="color:#6b7280">${safeKey}</span>&nbsp;&nbsp;${safeTitle}
    </p>
    ${cta(taskUrl, "View task")}`,
    manageUrl,
  );

  return { subject, html };
};
