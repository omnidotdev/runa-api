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
 * Stores LLM provider configuration and agent behavior settings per organization.
 * 1:1 relationship with organizations (via organizationId from IDP).
 */
export const agentConfigs = pgTable(
  "agent_config",
  {
    id: generateDefaultId(),
    organizationId: text().notNull().unique(),

    // LLM Provider
    provider: text().notNull().default("anthropic"),
    model: text().notNull().default("claude-sonnet-4-5"),

    // BYOK: Encrypted API key provided by the organization.
    // Stored as AES-256-GCM ciphertext (base64). Decrypted in-memory only.
    encryptedApiKey: text(),
    // Provider associated with the encrypted key (e.g. "anthropic", "openai").
    // Must match `provider` when set. Null when using server-level env keys.
    keyProvider: text(),

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
