/**
 * Markdown to HTML conversion for AI agent outputs.
 *
 * The frontend stores task descriptions as HTML (rendered by a Lexical editor).
 * This utility converts markdown from the AI agent into compatible HTML.
 */

import { marked } from "marked";

/**
 * Convert markdown text to HTML.
 *
 * Handles common markdown patterns the agent might use:
 * - Headings (# ## ###)
 * - Lists (- * 1.)
 * - Bold/italic (**bold** *italic*)
 * - Code blocks (``` and inline `)
 * - Links [text](url)
 *
 * Returns the input unchanged if it appears to already be HTML.
 */
export function markdownToHtml(input: string): string {
  if (!input || input.trim().length === 0) {
    return input;
  }

  // If it already looks like HTML (starts with a tag), return as-is
  if (input.trim().startsWith("<")) {
    return input;
  }

  // Configure marked for safe output
  const html = marked.parse(input, {
    async: false,
    breaks: true, // Convert \n to <br>
    gfm: true, // GitHub Flavored Markdown
  }) as string;

  return html;
}
