import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { generateDefaultDate, generateDefaultId } from "lib/db/util";
import { projects } from "./project.table";

import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

/**
 * Agent webhook table.
 *
 * Stores webhook configurations that trigger agent sessions
 * when external events arrive (e.g. GitHub PR merged, issue opened).
 * Each webhook is scoped to a project and has an HMAC-SHA256
 * signing secret for payload verification.
 */
export const agentWebhooks = pgTable(
  "agent_webhook",
  {
    id: generateDefaultId(),
    organizationId: text().notNull(),
    projectId: uuid()
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),

    // Webhook identity
    name: text().notNull(),
    eventType: text().notNull(),

    // Instruction template with {event} placeholder for the agent
    instructionTemplate: text().notNull(),

    // HMAC-SHA256 signing secret (generated server-side, displayed once)
    signingSecret: text().notNull(),

    // State
    enabled: boolean().notNull().default(true),
    lastTriggeredAt: timestamp({ withTimezone: true }),

    createdAt: generateDefaultDate(),
    updatedAt: generateDefaultDate(),
  },
  (table) => [
    uniqueIndex().on(table.id),
    index("agent_webhook_organization_id_idx").on(table.organizationId),
    index("agent_webhook_project_id_idx").on(table.projectId),
    index("agent_webhook_project_enabled_idx").on(
      table.projectId,
      table.enabled,
    ),
  ],
);

export const agentWebhookRelations = relations(agentWebhooks, ({ one }) => ({
  project: one(projects, {
    fields: [agentWebhooks.projectId],
    references: [projects.id],
  }),
}));

export type InsertAgentWebhook = InferInsertModel<typeof agentWebhooks>;
export type SelectAgentWebhook = InferSelectModel<typeof agentWebhooks>;
