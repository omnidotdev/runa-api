/**
 * Centralized constants for AI agent configuration.
 *
 * Keeping limits in one place makes them easier to audit,
 * adjust, and reference consistently across endpoints.
 *
 * @knipignore - Constants are exported for consistent reference across the codebase
 */

// ─────────────────────────────────────────────────────────────────────────────
// Rate Limits
// ─────────────────────────────────────────────────────────────────────────────

/** Maximum chat requests per user per minute. */
export const USER_CHAT_RATE_LIMIT = 20;

/** Maximum chat requests per organization per minute. */
export const ORG_CHAT_RATE_LIMIT = 100;

// ─────────────────────────────────────────────────────────────────────────────
// Content Length Limits
// ─────────────────────────────────────────────────────────────────────────────

/** Maximum length for persona system prompts. */
export const MAX_PERSONA_SYSTEM_PROMPT_LENGTH = 4_000;

/** Maximum length for persona names. */
export const MAX_PERSONA_NAME_LENGTH = 100;

/** Maximum length for persona descriptions. */
export const MAX_PERSONA_DESCRIPTION_LENGTH = 500;

/** Maximum length for custom instructions in agent config. */
export const MAX_CUSTOM_INSTRUCTIONS_LENGTH = 2_000;

/** Maximum length for schedule instructions. */
export const MAX_SCHEDULE_INSTRUCTION_LENGTH = 4_000;

/** Maximum length for schedule names. */
export const MAX_SCHEDULE_NAME_LENGTH = 100;

/** Maximum length for webhook instruction templates. */
export const MAX_WEBHOOK_TEMPLATE_LENGTH = 4_000;

/** Maximum length for webhook names. */
export const MAX_WEBHOOK_NAME_LENGTH = 100;

/** Maximum length for @mention triggered instructions (shorter for safety). */
export const MAX_MENTION_INSTRUCTION_LENGTH = 2_000;

// ─────────────────────────────────────────────────────────────────────────────
// Entity Limits
// ─────────────────────────────────────────────────────────────────────────────

/** Maximum schedules allowed per project. */
export const MAX_SCHEDULES_PER_PROJECT = 20;

/** Maximum webhooks allowed per project. */
export const MAX_WEBHOOKS_PER_PROJECT = 10;

/** Maximum personas allowed per organization. */
export const MAX_PERSONAS_PER_ORGANIZATION = 50;

// ─────────────────────────────────────────────────────────────────────────────
// Agent Execution
// ─────────────────────────────────────────────────────────────────────────────

/** Default maximum agent iterations per request. */
export const DEFAULT_MAX_ITERATIONS = 10;

/** Minimum allowed max iterations. */
export const MIN_MAX_ITERATIONS = 1;

/** Maximum allowed max iterations. */
export const MAX_MAX_ITERATIONS = 20;

/** Maximum delegation depth for agent-to-agent handoff (0 = primary, 1 = first delegate, etc.). */
export const MAX_DELEGATION_DEPTH = 2;

/** Max iterations for a delegated sub-agent (lower than primary to bound cost). */
export const DELEGATE_MAX_ITERATIONS = 5;

/** Wall-clock timeout for a single delegation in milliseconds. */
export const DELEGATE_TIMEOUT_MS = 60_000;

/** Max response length returned from a delegate (prevents parent context exhaustion). */
export const MAX_DELEGATE_RESPONSE_LENGTH = 4_000;

// ─────────────────────────────────────────────────────────────────────────────
// Model Configuration
// ─────────────────────────────────────────────────────────────────────────────

/** Default model when none configured (OpenRouter format: provider/model). */
export const DEFAULT_MODEL = "anthropic/claude-sonnet-4.5";

/**
 * Allowed model identifiers for OpenRouter.
 * Uses the format: provider/model-name
 *
 * @see https://openrouter.ai/models for full list
 */
export const ALLOWED_MODELS = [
  // Anthropic
  "anthropic/claude-sonnet-4.5",
  "anthropic/claude-haiku-4.5",
  "anthropic/claude-opus-4",
  // OpenAI
  "openai/gpt-4o",
  "openai/gpt-4o-mini",
  "openai/gpt-4-turbo",
  "openai/o3-mini",
  // Google
  "google/gemini-2.0-flash-001",
  "google/gemini-2.5-pro-preview-05-06",
  // DeepSeek
  "deepseek/deepseek-chat",
  "deepseek/deepseek-r1",
  // Meta
  "meta-llama/llama-3.3-70b-instruct",
] as const;

/** Union type of allowed model identifiers. */
export type AllowedModel = (typeof ALLOWED_MODELS)[number];

/**
 * Check whether a model name is in the allowed list.
 */
export function isAllowedModel(model: string): model is AllowedModel {
  return ALLOWED_MODELS.includes(model as AllowedModel);
}

