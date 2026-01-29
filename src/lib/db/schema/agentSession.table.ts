import { relations } from "drizzle-orm";
import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { generateDefaultDate, generateDefaultId } from "lib/db/util";
import { projects } from "./project.table";
import { users } from "./user.table";

import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

/**
 * Session type discriminator.
 *
 * - `project_chat`: Standard chat within an existing project (projectId required)
 * - `project_creation`: Project creation flow (projectId null until created)
 */
export type AgentSessionType = "project_chat" | "project_creation";

/**
 * Agent session table.
 *
 * Stores conversation history for agent chat sessions.
 * Sessions can be scoped to a user within a project (project_chat)
 * or at the organization level for project creation (project_creation).
 */
export const agentSessions = pgTable(
  "agent_session",
  {
    id: generateDefaultId(),
    organizationId: text().notNull(),
    // Nullable for project_creation sessions (project doesn't exist yet)
    projectId: uuid().references(() => projects.id, { onDelete: "cascade" }),
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    // Session type discriminator
    type: varchar({ length: 20 })
      .notNull()
      .default("project_chat")
      .$type<AgentSessionType>(),

    // Chat state
    title: text(),
    messages: jsonb().notNull().default([]),

    // Usage tracking
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
    index("agent_session_type_idx").on(table.type),
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
