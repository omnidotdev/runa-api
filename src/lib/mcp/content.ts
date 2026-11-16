/**
 * Text conversion between MCP clients (plain text) and Runa's stored rich text
 * (HTML produced by the web editor)
 */

import { htmlToText } from "lib/notifications/mentions";

export { htmlToText };

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

/**
 * Convert plain text to the editor's HTML: one paragraph per line, every line
 * escaped so client-supplied text can never inject markup
 */
export const plainTextToHtml = (text: string): string =>
  text
    .split(/\r?\n/)
    .map((line) => `<p>${escapeHtml(line)}</p>`)
    .join("");
