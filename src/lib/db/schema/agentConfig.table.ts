import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  uniqueIndex,
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

    // Agent behavior
    enabled: boolean().notNull().default(false),
    maxIterationsPerRequest: integer().notNull().default(10),

    // Approval settings
    requireApprovalForDestructive: boolean().notNull().default(true),
    requireApprovalForCreate: boolean().notNull().default(false),

    // Custom system prompt additions (appended to base prompt)
    customInstructions: text(),

    createdAt: generateDefaultDate(),
    updatedAt: generateDefaultDate(),
  },
  (table) => [
    uniqueIndex().on(table.id),
    index("agent_config_organization_id_idx").on(table.organizationId),
  ],
);

export const agentConfigRelations = relations(agentConfigs, () => ({}));

export type InsertAgentConfig = InferInsertModel<typeof agentConfigs>;
export type SelectAgentConfig = InferSelectModel<typeof agentConfigs>;
