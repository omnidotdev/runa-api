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

import type { SelectAgentConfig } from "lib/db/schema";

/** Default provider when none configured. */
const DEFAULT_PROVIDER = "anthropic";

/** Default model when none configured. */
const DEFAULT_MODEL = "claude-sonnet-4-5";

/** Default max agent loop iterations. */
const DEFAULT_MAX_ITERATIONS = 10;

/** Maximum allowed iterations (safety cap). */
const MAX_ITERATIONS_CAP = 20;

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
  };
}

/**
 * Create a TanStack AI adapter for the given provider and model.
 */
export function createAdapter(provider: string, model: string) {
  switch (provider) {
    case "anthropic": {
      if (!ANTHROPIC_API_KEY) {
        throw new Error("ANTHROPIC_API_KEY is not configured");
      }
      // Model name comes from dynamic config — cast to satisfy literal type constraint
      return createAnthropicChat(model as "claude-sonnet-4-5", ANTHROPIC_API_KEY);
    }
    case "openai": {
      if (!OPENAI_API_KEY) {
        throw new Error("OPENAI_API_KEY is not configured");
      }
      return createOpenaiChat(model as "gpt-4o", OPENAI_API_KEY);
    }
    default:
      throw new Error(`Unsupported AI provider: ${provider}`);
  }
}
