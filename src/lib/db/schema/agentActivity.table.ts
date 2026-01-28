import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  jsonb,
  pgTable,
  text,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { generateDefaultDate, generateDefaultId } from "lib/db/util";
import { agentSessions } from "./agentSession.table";
import { projects } from "./project.table";
import { users } from "./user.table";

import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

/**
 * Agent activity table.
 *
 * Audit log for all agent tool executions.
 * Every tool call (executed, failed, or denied) is recorded for transparency.
 */
export const agentActivities = pgTable(
  "agent_activity",
  {
    id: generateDefaultId(),
    organizationId: text().notNull(),
    projectId: uuid()
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    sessionId: uuid()
      .notNull()
      .references(() => agentSessions.id, { onDelete: "cascade" }),
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    // What happened
    toolName: text().notNull(),
    toolInput: jsonb().notNull(),
    toolOutput: jsonb(),

    // Approval tracking
    requiresApproval: boolean().notNull().default(false),
    approvalStatus: text(),

    // Outcome
    status: text().notNull().default("completed"),
    errorMessage: text(),

    // Affected entities (for quick filtering)
    affectedTaskIds: jsonb().notNull().default([]),

    // Undo/rollback support: snapshot of entity state before the write.
    // Used to restore the previous state when rolling back an activity.
    // NULL for query tools, "denied"/"failed" activities, or irreversible actions.
    snapshotBefore: jsonb(),

    createdAt: generateDefaultDate(),
  },
  (table) => [
    uniqueIndex().on(table.id),
    index("agent_activity_organization_id_idx").on(table.organizationId),
    index("agent_activity_project_id_idx").on(table.projectId),
    index("agent_activity_session_id_idx").on(table.sessionId),
    index("agent_activity_user_id_idx").on(table.userId),
    index("agent_activity_tool_name_idx").on(table.toolName),
    index("agent_activity_project_created_idx").on(
      table.projectId,
      table.createdAt,
    ),
  ],
);

export const agentActivityRelations = relations(agentActivities, ({ one }) => ({
  session: one(agentSessions, {
    fields: [agentActivities.sessionId],
    references: [agentSessions.id],
  }),
  user: one(users, {
    fields: [agentActivities.userId],
    references: [users.id],
  }),
  project: one(projects, {
    fields: [agentActivities.projectId],
    references: [projects.id],
  }),
}));

export type InsertAgentActivity = InferInsertModel<typeof agentActivities>;
export type SelectAgentActivity = InferSelectModel<typeof agentActivities>;
