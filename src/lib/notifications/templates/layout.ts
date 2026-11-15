/**
 * Shared building blocks for Runa notification emails: the brand palette, the
 * moon-marked shell, the CTA button, and the escaping/truncation helpers every
 * template uses so user-supplied text can never inject markup. Pure functions
 * only; delivery is the caller's job (the notifications provider / Herald)
 */

/** Runa brand primary (amber), from the product catalog SSOT */
const BRAND = "#f89d00";

/** Rendered email content, ready to hand to the notifications provider */
export interface EmailContent {
  subject: string;
  html: string;
}

/** Escape user-supplied text so it cannot inject markup into the email HTML */
export const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

/** Collapse whitespace and truncate text for safe display in subject/body */
export const cleanTitle = (value: string, max = 120): string => {
  const collapsed = value.replace(/\s+/g, " ").trim();
  if (collapsed.length <= max) return collapsed;
  return `${collapsed.slice(0, max - 1).trimEnd()}…`;
};

/** Why the recipient is getting the email, shown in the footer */
type EmailReason = "workspace" | "involved" | "mentioned";

const REASON_TEXT: Record<EmailReason, string> = {
  workspace: "You're receiving this because you're a member of this workspace.",
  involved:
    "You're receiving this because you created, are assigned to, or commented on this task.",
  mentioned: "You're receiving this because you were mentioned.",
};

/**
 * Wrap body content in Runa's branded shell. When a manage-preferences URL is
 * known the footer becomes a real link; otherwise it stays plain informational
 * text rather than implying a click that goes nowhere
 */
export const layout = (
  heading: string,
  bodyHtml: string,
  manageUrl?: string | null,
  reason: EmailReason = "workspace",
): string => {
  const why = REASON_TEXT[reason];
  const footer = manageUrl
    ? `${why} Manage your notifications from <a href="${manageUrl}" style="color:${BRAND}">your settings</a>.`
    : `${why} Manage your notifications from your settings.`;
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
export const cta = (href: string | null | undefined, label: string): string =>
  href
    ? `
<p style="text-align:center;margin:24px 0">
  <a href="${href}" style="background:${BRAND};color:#fff;border-radius:8px;padding:12px 16px;text-decoration:none;display:inline-block">${label}</a>
</p>`.trim()
    : "";
