/**
 * Runa-branded digest email listing several task assignments in one message,
 * for users whose assignment-email cadence is "digest". Same palette and moon
 * mark as the single-assignment email. Pure content: returns `{ subject, html }`
 */

/** Runa brand primary (amber), from the product catalog SSOT */
const BRAND = "#f89d00";

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const cleanTitle = (value: string, max = 120): string => {
  const collapsed = value.replace(/\s+/g, " ").trim();
  if (collapsed.length <= max) return collapsed;
  return `${collapsed.slice(0, max - 1).trimEnd()}…`;
};

const layout = (
  heading: string,
  bodyHtml: string,
  manageUrl?: string | null,
): string => {
  const footer = manageUrl
    ? `You're receiving this because you're a member of this workspace. Manage your notifications from <a href="${manageUrl}" style="color:${BRAND}">your settings</a>.`
    : "You're receiving this because you're a member of this workspace. Manage your notifications from your settings.";
  return `
<div style="font-family:Assistant,Verdana,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#374151">
  <p style="text-align:center;font-size:26px;margin:0 0 8px">\u{1F319}</p>
  <h1 style="font-size:22px;font-weight:400;text-align:center;margin:8px 0 24px">${heading}</h1>
  ${bodyHtml}
  <hr style="border:none;border-top:1px solid #eaeaea;margin:24px 0" />
  <p style="font-size:12px;color:#9ca3af;text-align:center">
    ${footer}
  </p>
  <p style="font-size:12px;color:#9ca3af;text-align:center">Made with \u{1F319} by Omni</p>
</div>`.trim();
};

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

interface EmailContent {
  subject: string;
  html: string;
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
