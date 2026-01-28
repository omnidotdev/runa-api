import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  pgTable,
  text,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import { generateDefaultDate, generateDefaultId } from "lib/db/util";

import { agentConfigs } from "./agentConfig.table";

import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

/**
 * Agent persona table.
 *
 * Stores reusable agent personas per organization. Each persona defines a
 * name, description, system prompt addition, and optional icon. Organizations
 * can create multiple personas and assign a default via `agent_config.default_persona_id`.
 */
export const agentPersonas = pgTable(
  "agent_persona",
  {
    id: generateDefaultId(),
    organizationId: text().notNull(),

    name: text().notNull(),
    description: text(),
    systemPrompt: text().notNull(),
    icon: text(),
    enabled: boolean().notNull().default(true),

    createdAt: generateDefaultDate(),
    updatedAt: generateDefaultDate(),
  },
  (table) => [
    uniqueIndex().on(table.id),
    index("agent_persona_organization_id_idx").on(table.organizationId),
  ],
);

/**
 * Add defaultPersonaId FK to agentConfigs.
 *
 * NOTE: The actual column is added in agentConfig.table.ts below. This
 * relation definition connects the two tables for Drizzle's relational
 * query builder.
 */
export const agentConfigPersonaRelations = relations(
  agentConfigs,
  ({ one }) => ({
    defaultPersona: one(agentPersonas, {
      fields: [agentConfigs.defaultPersonaId],
      references: [agentPersonas.id],
    }),
  }),
);

export type InsertAgentPersona = InferInsertModel<typeof agentPersonas>;
export type SelectAgentPersona = InferSelectModel<typeof agentPersonas>;
