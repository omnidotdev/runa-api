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
import { agentPersonas } from "./agentPersona.table";
import { projects } from "./project.table";

import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

/**
 * Agent schedule table.
 *
 * Stores cron-based schedules that trigger agent sessions at regular intervals.
 * Each schedule is scoped to a project and optionally references a persona.
 *
 * Scheduling is DB-polled: a background interval checks for schedules where
 * `next_run_at <= NOW()` and `enabled = true`, then executes them.
 */
export const agentSchedules = pgTable(
  "agent_schedule",
  {
    id: generateDefaultId(),
    organizationId: text().notNull(),
    projectId: uuid()
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),

    // Schedule identity
    name: text().notNull(),
    cronExpression: text().notNull(),
    instruction: text().notNull(),

    // Optional persona override for this schedule
    personaId: uuid().references(() => agentPersonas.id, {
      onDelete: "set null",
    }),

    // State
    enabled: boolean().notNull().default(true),
    lastRunAt: timestamp({ withTimezone: true }),
    nextRunAt: timestamp({ withTimezone: true }),

    createdAt: generateDefaultDate(),
    updatedAt: generateDefaultDate(),
  },
  (table) => [
    uniqueIndex().on(table.id),
    index("agent_schedule_organization_id_idx").on(table.organizationId),
    index("agent_schedule_project_id_idx").on(table.projectId),
    index("agent_schedule_enabled_next_run_idx").on(
      table.enabled,
      table.nextRunAt,
    ),
  ],
);

export const agentScheduleRelations = relations(
  agentSchedules,
  ({ one }) => ({
    project: one(projects, {
      fields: [agentSchedules.projectId],
      references: [projects.id],
    }),
    persona: one(agentPersonas, {
      fields: [agentSchedules.personaId],
      references: [agentPersonas.id],
    }),
  }),
);

export type InsertAgentSchedule = InferInsertModel<typeof agentSchedules>;
export type SelectAgentSchedule = InferSelectModel<typeof agentSchedules>;
