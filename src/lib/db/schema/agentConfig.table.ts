import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { generateDefaultDate, generateDefaultId } from "lib/db/util";

import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

/**
 * Agent configuration table.
 *
 * Stores LLM configuration and agent behavior settings per organization.
 * Uses OpenRouter as the unified LLM provider (access to 300+ models).
 * 1:1 relationship with organizations (via organizationId from IDP).
 */
export const agentConfigs = pgTable(
  "agent_config",
  {
    id: generateDefaultId(),
    organizationId: text().notNull().unique(),

    // LLM Model (OpenRouter format: provider/model-name)
    // e.g., "anthropic/claude-sonnet-4.5", "openai/gpt-4o"
    model: text().notNull().default("anthropic/claude-sonnet-4.5"),

    // BYOK: Encrypted OpenRouter API key provided by the organization.
    // Stored as AES-256-GCM ciphertext (base64). Decrypted in-memory only.
    encryptedApiKey: text(),

    // Agent behavior
    enabled: boolean().notNull().default(false),
    maxIterationsPerRequest: integer().notNull().default(10),

    // Approval settings
    requireApprovalForDestructive: boolean().notNull().default(true),
    requireApprovalForCreate: boolean().notNull().default(false),

    // Custom system prompt additions (appended to base prompt)
    customInstructions: text(),

    // Default persona for new sessions (FK to agent_persona.id)
    defaultPersonaId: uuid(),

    createdAt: generateDefaultDate(),
    updatedAt: generateDefaultDate(),
  },
  (table) => [
    uniqueIndex().on(table.id),
    index("agent_config_organization_id_idx").on(table.organizationId),
  ],
);

export type InsertAgentConfig = InferInsertModel<typeof agentConfigs>;
export type SelectAgentConfig = InferSelectModel<typeof agentConfigs>;
