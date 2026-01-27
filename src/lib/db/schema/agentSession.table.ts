import { relations } from "drizzle-orm";
import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { generateDefaultDate, generateDefaultId } from "lib/db/util";
import { projects } from "./project.table";
import { users } from "./user.table";

import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

/**
 * Agent session table.
 *
 * Stores conversation history for agent chat sessions,
 * scoped to a user within a project.
 */
export const agentSessions = pgTable(
  "agent_session",
  {
    id: generateDefaultId(),
    organizationId: text().notNull(),
    projectId: uuid()
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    // Chat state
    title: text(),
    messages: jsonb().notNull().default([]),

    // Usage tracking
    totalTokensUsed: integer().notNull().default(0),
    toolCallCount: integer().notNull().default(0),

    createdAt: generateDefaultDate(),
    updatedAt: generateDefaultDate(),
  },
  (table) => [
    uniqueIndex().on(table.id),
    index("agent_session_organization_id_idx").on(table.organizationId),
    index("agent_session_project_id_idx").on(table.projectId),
    index("agent_session_user_id_idx").on(table.userId),
    index("agent_session_user_project_idx").on(table.userId, table.projectId),
  ],
);

export const agentSessionRelations = relations(agentSessions, ({ one }) => ({
  project: one(projects, {
    fields: [agentSessions.projectId],
    references: [projects.id],
  }),
  user: one(users, {
    fields: [agentSessions.userId],
    references: [users.id],
  }),
}));

export type InsertAgentSession = InferInsertModel<typeof agentSessions>;
export type SelectAgentSession = InferSelectModel<typeof agentSessions>;
