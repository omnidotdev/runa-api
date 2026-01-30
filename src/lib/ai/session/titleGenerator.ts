/**
 * AI-powered session title generation.
 *
 * Uses a lightweight model to generate concise, descriptive titles
 * based on the first user message and assistant response.
 */

import { generateText } from "ai";

import { createOpenRouterModel } from "../provider";
import { updateSessionTitle } from "./manager";

/** Model to use for title generation (fast and cheap). */
const TITLE_MODEL = "anthropic/claude-haiku-4.5";

/** Maximum tokens for title generation. */
const MAX_TITLE_TOKENS = 20;

/** Maximum characters for the generated title. */
const MAX_TITLE_LENGTH = 100;

/** Maximum characters to include from messages for context. */
const MAX_MESSAGE_CONTEXT = 500;

/**
 * Sanitize an AI-generated title by removing control characters and HTML.
 */
function sanitizeTitle(text: string): string {
  let result = text.trim();

  // Remove control characters (ASCII 0-31 and 127)
  result = result
    .split("")
    .filter((char) => {
      const code = char.charCodeAt(0);
      return code >= 32 && code !== 127;
    })
    .join("");

  // Remove potential HTML angle brackets
  result = result.replace(/[<>]/g, "");

  return result.slice(0, MAX_TITLE_LENGTH);
}

/**
 * Generate a title for a chat session based on the first exchange.
 *
 * This function is designed to be called fire-and-forget after the first
 * assistant response completes for a new session. It uses a fast, lightweight
 * model to generate a concise 3-6 word title.
 *
 * @param sessionId - The session to update
 * @param userMessage - The first user message content
 * @param assistantResponse - The first assistant response content
 * @param orgApiKey - Optional organization API key for BYOK
 */
export async function generateSessionTitle(
  sessionId: string,
  userMessage: string,
  assistantResponse: string,
  orgApiKey?: string | null,
): Promise<void> {
  try {
    const model = createOpenRouterModel(TITLE_MODEL, orgApiKey);

    const result = await generateText({
      model,
      messages: [
        {
          role: "user",
          content: `Generate a concise 3-6 word title summarizing this chat. Return ONLY the title, no quotes or punctuation.

User: ${userMessage.slice(0, MAX_MESSAGE_CONTEXT)}
Assistant: ${assistantResponse.slice(0, MAX_MESSAGE_CONTEXT)}`,
        },
      ],
      maxOutputTokens: MAX_TITLE_TOKENS,
    });

    const title = sanitizeTitle(result.text);

    if (title) {
      await updateSessionTitle(sessionId, title);
    }
  } catch (error) {
    console.error("[AI] Failed to generate session title:", {
      sessionId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Extract text content from a ModelMessage content field.
 *
 * The content can be a string or an array of content parts.
 * This function extracts and concatenates all text content.
 */
export function extractTextFromContent(content: unknown): string {
  if (typeof content === "string") {
    return content;
  }

  if (Array.isArray(content)) {
    return content
      .filter(
        (part): part is { type: "text"; text: string } =>
          typeof part === "object" &&
          part !== null &&
          part.type === "text" &&
          typeof part.text === "string",
      )
      .map((part) => part.text)
      .join("");
  }

  return "";
}
