/**
 * OpenRouter provider configuration for Vercel AI SDK.
 *
 * Uses the @openrouter/ai-sdk-provider package for OpenRouter's API.
 * Supports BYOK (Bring Your Own Key) for organization-level API keys.
 */

import { createOpenRouter } from "@openrouter/ai-sdk-provider";

import { OPENROUTER_API_KEY } from "lib/config/env.config";
import { ALLOWED_MODELS, isAllowedModel } from "./constants";

/**
 * Create an OpenRouter model provider for Vercel AI SDK.
 *
 * Validates the model name against the allowed list to prevent arbitrary
 * model strings from being passed to the LLM API.
 *
 * When an org-provided API key is available, it takes precedence over
 * the server-level environment variable (BYOK support).
 *
 * @param model - The model identifier in OpenRouter format (e.g., "anthropic/claude-sonnet-4.5")
 * @param orgApiKey - Optional organization-provided API key (takes precedence over env var)
 * @returns A Vercel AI SDK compatible model instance
 */
export function createOpenRouterModel(
  model: string,
  orgApiKey?: string | null,
) {
  if (!isAllowedModel(model)) {
    throw new Error(
      `Model "${model}" is not allowed. Allowed models: ${ALLOWED_MODELS.join(", ")}`,
    );
  }

  const apiKey = orgApiKey ?? OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not configured");
  }

  const openrouter = createOpenRouter({
    apiKey,
  });

  return openrouter.chat(model);
}
