import { createAnthropicChat } from "@tanstack/ai-anthropic";
import { createOpenaiChat } from "@tanstack/ai-openai";

import {
  AGENT_DEFAULT_MODEL,
  AGENT_DEFAULT_PROVIDER,
  AGENT_MAX_ITERATIONS,
  ANTHROPIC_API_KEY,
  OPENAI_API_KEY,
} from "lib/config/env.config";
import { dbPool } from "lib/db/db";

import { decrypt } from "./encryption";

import type { SelectAgentConfig, SelectAgentPersona } from "lib/db/schema";

/** Default provider when none configured. */
const DEFAULT_PROVIDER = "anthropic";

/** Default model when none configured. */
const DEFAULT_MODEL = "claude-sonnet-4-5";

/** Default max agent loop iterations. */
const DEFAULT_MAX_ITERATIONS = 10;

/** Maximum allowed iterations (safety cap). */
const MAX_ITERATIONS_CAP = 20;

/** Allowed model identifiers per provider. */
const ALLOWED_MODELS: Record<string, readonly string[]> = {
  anthropic: [
    "claude-sonnet-4-5",
    "claude-haiku-3-5",
    "claude-sonnet-4-20250514",
    "claude-opus-4-20250514",
  ] as const,
  openai: [
    "gpt-4o",
    "gpt-4o-mini",
    "gpt-4-turbo",
    "o3-mini",
  ] as const,
};

/**
 * Check whether a model name is allowed for the given provider.
 */
function isAllowedModel(provider: string, model: string): boolean {
  const allowed = ALLOWED_MODELS[provider];
  if (!allowed) return false;
  return allowed.includes(model);
}

/**
 * Resolved agent configuration combining env defaults with org-level overrides.
 */
export interface ResolvedAgentConfig {
  provider: string;
  model: string;
  maxIterations: number;
  requireApprovalForDestructive: boolean;
  requireApprovalForCreate: boolean;
  customInstructions: string | null;
  /** Decrypted org-provided API key, or null to use server env vars. */
  orgApiKey: string | null;
  /** Default persona for new chat sessions, if one is configured. */
  defaultPersona: { name: string; systemPrompt: string } | null;
}

/**
 * Load agent configuration for an organization.
 * Falls back to environment defaults if no org config exists.
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

  const envMaxIterations = AGENT_MAX_ITERATIONS
    ? Number.parseInt(AGENT_MAX_ITERATIONS, 10)
    : DEFAULT_MAX_ITERATIONS;

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
    provider: orgConfig?.provider ?? AGENT_DEFAULT_PROVIDER ?? DEFAULT_PROVIDER,
    model: orgConfig?.model ?? AGENT_DEFAULT_MODEL ?? DEFAULT_MODEL,
    maxIterations: Math.min(
      orgConfig?.maxIterationsPerRequest ?? envMaxIterations,
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
 * Create a TanStack AI adapter for the given provider and model.
 *
 * Validates the model name against the allowed list for the provider
 * to prevent arbitrary model strings from being passed to the LLM API.
 *
 * When an org-provided API key is available, it takes precedence over
 * server-level environment variables (BYOK support).
 */
export function createAdapter(
  provider: string,
  model: string,
  orgApiKey?: string | null,
) {
  if (!isAllowedModel(provider, model)) {
    const allowed = ALLOWED_MODELS[provider];
    throw new Error(
      allowed
        ? `Model "${model}" is not allowed for provider "${provider}". Allowed models: ${allowed.join(", ")}`
        : `Unsupported AI provider: ${provider}`,
    );
  }

  switch (provider) {
    case "anthropic": {
      const apiKey = orgApiKey ?? ANTHROPIC_API_KEY;
      if (!apiKey) {
        throw new Error("ANTHROPIC_API_KEY is not configured");
      }
      return createAnthropicChat(model as "claude-sonnet-4-5", apiKey);
    }
    case "openai": {
      const apiKey = orgApiKey ?? OPENAI_API_KEY;
      if (!apiKey) {
        throw new Error("OPENAI_API_KEY is not configured");
      }
      return createOpenaiChat(model as "gpt-4o", apiKey);
    }
    default:
      throw new Error(`Unsupported AI provider: ${provider}`);
  }
}
