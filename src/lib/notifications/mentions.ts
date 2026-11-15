/**
 * Rich-text mention parsing.
 *
 * The web app's `@`-typeahead inserts a mention as a link whose href is
 * `#mention-<idpUserId>` (see runa-app `useMentionItems`). A fragment href keeps
 * a click inert in the read-only renderers while carrying the mentioned user's
 * stable identity-provider id, so the server can resolve who was mentioned
 * without trusting the display label. Older mentions (href `#`) carry no id and
 * are intentionally ignored
 */

/** Matches a mention href and captures the IDP user id (a uuid) */
const MENTION_HREF_PATTERN =
  /href\s*=\s*["']#mention-([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})["']/gi;

/** Unique IDP user ids mentioned in a rich-text HTML document, in order */
export const extractMentionIds = (
  html: string | null | undefined,
): string[] => {
  if (!html) return [];

  const ids = new Set<string>();
  for (const match of html.matchAll(MENTION_HREF_PATTERN)) {
    if (match[1]) ids.add(match[1].toLowerCase());
  }

  return [...ids];
};

/**
 * IDP user ids mentioned in `after` but not in `before`, so editing a document
 * only notifies people who were newly mentioned, never everyone already in it
 */
export const newlyMentionedIds = (
  before: string | null | undefined,
  after: string | null | undefined,
): string[] => {
  const previous = new Set(extractMentionIds(before));
  return extractMentionIds(after).filter((id) => !previous.has(id));
};

const ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&#x27;": "'",
  "&nbsp;": " ",
};

/**
 * Reduce stored rich-text HTML to plain text for an email excerpt. Block-level
 * boundaries become spaces so words never run together; the result is NOT
 * HTML-safe and must be escaped before it is placed in markup
 */
export const htmlToText = (html: string | null | undefined): string => {
  if (!html) return "";

  return html
    .replace(/<\s*(br|\/p|\/div|\/li|\/h[1-6]|\/blockquote)\b[^>]*>/gi, " ")
    .replace(/<[^>]*>/g, "")
    .replace(
      /&(amp|lt|gt|quot|#39|#x27|nbsp);/g,
      (entity) => ENTITIES[entity] ?? entity,
    )
    .replace(/\s+/g, " ")
    .trim();
};
