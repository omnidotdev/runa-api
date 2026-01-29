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

/** Maximum delegation depth for agent-to-agent handoff. */
export const MAX_DELEGATION_DEPTH = 2;

// ─────────────────────────────────────────────────────────────────────────────
// Approval Flow
// ─────────────────────────────────────────────────────────────────────────────

/** Prefix used by TanStack AI for approval IDs. */
export const APPROVAL_ID_PREFIX = "approval_";

/** Marker message content for approval continuation. */
export const CONTINUATION_MARKER = "[CONTINUE_AFTER_APPROVAL]";
