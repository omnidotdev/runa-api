/**
 * Runa-branded digest email listing several task assignments in one message,
 * for users whose assignment-email cadence is "digest". Same palette and moon
 * mark as the single-assignment email. Pure content: returns `{ subject, html }`
 */

import { cleanTitle, escapeHtml, layout } from "./layout";

import type { EmailContent } from "./layout";

export interface DigestTaskItem {
  /** Raw task title (task.content); escaped and truncated internally */
  taskTitle: string;
  /** Display key, e.g. "API-42" */
  taskDisplayKey: string;
  /** Project name */
  projectName: string;
  /** Deep link to the task, or null when it cannot be built */
  taskUrl: string | null;
}

/** One task row in the digest, linked when a URL is available. */
const taskRow = (item: DigestTaskItem): string => {
  const safeKey = escapeHtml(item.taskDisplayKey);
  const safeTitle = escapeHtml(cleanTitle(item.taskTitle));
  const safeProject = escapeHtml(item.projectName);
  const label = `<span style="color:#6b7280">${safeKey}</span>&nbsp;&nbsp;${safeTitle}`;
  const linked = item.taskUrl
    ? `<a href="${item.taskUrl}" style="color:#111827;text-decoration:none">${label}</a>`
    : label;
  return `
<tr>
  <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;font-size:14px;line-height:20px">
    ${linked}
    <div style="font-size:12px;color:#9ca3af;margin-top:2px">${safeProject}</div>
  </td>
</tr>`.trim();
};

/**
 * Build a digest email listing several assigned tasks. The subject states the
 * count; the body lists each task with its key, title, project, and link
 */
export const buildTasksAssignedDigestEmail = (
  items: DigestTaskItem[],
  manageUrl: string | null,
): EmailContent => {
  const count = items.length;
  const subject =
    count === 1
      ? `You were assigned ${items[0]?.taskDisplayKey ?? "a task"}`
      : `You were assigned ${count} tasks`;

  const rows = items.map(taskRow).join("");

  const html = layout(
    count === 1
      ? "You've been assigned a task"
      : `You've been assigned ${count} tasks`,
    `<table role="presentation" width="100%" style="border-collapse:collapse">${rows}</table>`,
    manageUrl,
  );

  return { subject, html };
};
