import { createOpenRouterText } from "@tanstack/ai-openrouter";

import { OPENROUTER_API_KEY } from "lib/config/env.config";
import { dbPool } from "lib/db/db";
import { decrypt } from "./encryption";

import type { SelectAgentConfig, SelectAgentPersona } from "lib/db/schema";

/** Default model when none configured (OpenRouter format: provider/model). */
const DEFAULT_MODEL = "anthropic/claude-sonnet-4.5";

/** Default max agent loop iterations. */
const DEFAULT_MAX_ITERATIONS = 10;

/** Maximum allowed iterations (safety cap). */
const MAX_ITERATIONS_CAP = 20;

/**
 * Allowed model identifiers for OpenRouter.
 * Uses the format: provider/model-name
 *
 * @see https://openrouter.ai/models for full list
 */
const ALLOWED_MODELS = [
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

type AllowedModel = (typeof ALLOWED_MODELS)[number];

/**
 * Check whether a model name is in the allowed list.
 */
function isAllowedModel(model: string): model is AllowedModel {
  return ALLOWED_MODELS.includes(model as AllowedModel);
}

/**
 * Resolved agent configuration combining defaults with org-level overrides.
 */
export interface ResolvedAgentConfig {
  model: string;
  maxIterations: number;
  requireApprovalForDestructive: boolean;
  requireApprovalForCreate: boolean;
  customInstructions: string | null;
  /** Decrypted org-provided OpenRouter API key, or null to use server env var. */
  orgApiKey: string | null;
  /** Default persona for new chat sessions, if one is configured. */
  defaultPersona: { name: string; systemPrompt: string } | null;
}

/**
 * Load agent configuration for an organization.
 * Falls back to defaults if no org config exists.
 */
export async function resolveAgentConfig(
  organizationId: string,
): Promise<ResolvedAgentConfig> {
  let orgConfig: SelectAgentConfig | undefined;

  try {
    orgConfig = await dbPool.query.agentConfigs.findFirst({
      where: (table, { eq }) => eq(table.organizationId, organizationId),
    });
  } catch {
    // Fall through to defaults if DB query fails
  }

  // Decrypt org-provided API key if present
  let orgApiKey: string | null = null;
  if (orgConfig?.encryptedApiKey) {
    try {
      orgApiKey = decrypt(orgConfig.encryptedApiKey);
    } catch {
      // If decryption fails (key rotated, corrupted), fall back to env vars.
      // The org admin will need to re-enter their key.
    }
  }

  // Load default persona if configured
  let defaultPersona: { name: string; systemPrompt: string } | null = null;
  if (orgConfig?.defaultPersonaId) {
    try {
      const persona: SelectAgentPersona | undefined =
        await dbPool.query.agentPersonas.findFirst({
          where: (table, { eq, and }) =>
            and(
              eq(table.id, orgConfig.defaultPersonaId!),
              eq(table.organizationId, organizationId),
              eq(table.enabled, true),
            ),
        });
      if (persona) {
        defaultPersona = {
          name: persona.name,
          systemPrompt: persona.systemPrompt,
        };
      }
    } catch {
      // Persona lookup failure is non-critical — continue without persona
    }
  }

  return {
    model: orgConfig?.model ?? DEFAULT_MODEL,
    maxIterations: Math.min(
      orgConfig?.maxIterationsPerRequest ?? DEFAULT_MAX_ITERATIONS,
      MAX_ITERATIONS_CAP,
    ),
    requireApprovalForDestructive:
      orgConfig?.requireApprovalForDestructive ?? true,
    requireApprovalForCreate: orgConfig?.requireApprovalForCreate ?? false,
    customInstructions: orgConfig?.customInstructions ?? null,
    orgApiKey,
    defaultPersona,
  };
}

/**
 * Load a specific persona by ID, verifying it belongs to the organization
 * and is enabled. Returns null if the persona does not exist or is disabled.
 */
export async function resolvePersona(
  personaId: string,
  organizationId: string,
): Promise<{ name: string; systemPrompt: string } | null> {
  try {
    const persona: SelectAgentPersona | undefined =
      await dbPool.query.agentPersonas.findFirst({
        where: (table, { eq, and }) =>
          and(
            eq(table.id, personaId),
            eq(table.organizationId, organizationId),
            eq(table.enabled, true),
          ),
      });
    return persona
      ? { name: persona.name, systemPrompt: persona.systemPrompt }
      : null;
  } catch {
    return null;
  }
}

/**
 * Create a TanStack AI OpenRouter adapter for the given model.
 *
 * Validates the model name against the allowed list to prevent arbitrary
 * model strings from being passed to the LLM API.
 *
 * When an org-provided API key is available, it takes precedence over
 * the server-level environment variable (BYOK support).
 */
export function createAdapter(model: string, orgApiKey?: string | null) {
  if (!isAllowedModel(model)) {
    throw new Error(
      `Model "${model}" is not allowed. Allowed models: ${ALLOWED_MODELS.join(", ")}`,
    );
  }

  const apiKey = orgApiKey ?? OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not configured");
  }

  return createOpenRouterText(model, apiKey);
}

/**
 * Get the list of allowed models for display in UI.
 */
export function getAllowedModels(): readonly string[] {
  return ALLOWED_MODELS;
}
