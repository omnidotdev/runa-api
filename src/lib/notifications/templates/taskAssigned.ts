/**
 * Runa-branded task-assignment email content. Mirrors the shared billing-email
 * style (a `layout` shell plus a `cta` button) but with Runa's palette and moon
 * mark. Pure content only: returns `{ subject, html }`; delivery is the caller's
 * job (the notifications provider / Herald)
 */

/** Runa brand primary (amber), from the product catalog SSOT */
const BRAND = "#f89d00";

/** Escape user-supplied text so it cannot inject markup into the email HTML */
const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

/** Collapse whitespace and truncate a title for safe display in subject/body */
const cleanTitle = (value: string, max = 120): string => {
  const collapsed = value.replace(/\s+/g, " ").trim();
  if (collapsed.length <= max) return collapsed;
  return `${collapsed.slice(0, max - 1).trimEnd()}…`;
};

/**
 * Wrap body content in Runa's branded shell. When a manage-preferences URL is
 * known the footer becomes a real link; otherwise it stays plain informational
 * text rather than implying a click that goes nowhere
 */
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

/** Centered brand-colored button, omitted when the href is unknown */
const cta = (href: string | null | undefined, label: string): string =>
  href
    ? `
<p style="text-align:center;margin:24px 0">
  <a href="${href}" style="background:${BRAND};color:#fff;border-radius:8px;padding:12px 16px;text-decoration:none;display:inline-block">${label}</a>
</p>`.trim()
    : "";

interface EmailContent {
  subject: string;
  html: string;
}

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
