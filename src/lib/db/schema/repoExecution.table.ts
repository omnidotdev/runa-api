import { relations } from "drizzle-orm";
import {
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { generateDefaultDate, generateDefaultId } from "lib/db/util";
import { taskExecutions } from "./taskExecution.table";

import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

/**
 * Repo execution table. Tracks per-repo work within a task execution.
 * Supports multi-repo execution plans (V1 constrains to single repo per task).
 */
export const repoExecutions = pgTable(
  "repo_execution",
  {
    id: generateDefaultId(),
    taskExecutionId: uuid()
      .notNull()
      .references(() => taskExecutions.id, { onDelete: "cascade" }),
    // Full repo identifier, e.g. "omnidotdev/runa-api"
    repo: text().notNull(),
    branch: text(),
    prUrl: text(),
    // pending: waiting for prior repo, in_progress: code work underway,
    // pr_opened: PR created, merged: PR merged, failed: unrecoverable error
    status: varchar({ length: 20 }).notNull().default("pending"),
    // Execution order within the task (1-based). Enables sequencing for multi-repo plans.
    order: integer().notNull().default(1),
    errorLog: text(),
    startedAt: timestamp({
      precision: 6,
      mode: "string",
      withTimezone: true,
    }),
    completedAt: timestamp({
      precision: 6,
      mode: "string",
      withTimezone: true,
    }),
    createdAt: generateDefaultDate(),
    updatedAt: generateDefaultDate(),
  },
  (table) => [
    uniqueIndex().on(table.id),
    index().on(table.taskExecutionId),
    index().on(table.status),
  ],
);

export const repoExecutionRelations = relations(
  repoExecutions,
  ({ one }) => ({
    taskExecution: one(taskExecutions, {
      fields: [repoExecutions.taskExecutionId],
      references: [taskExecutions.id],
    }),
  }),
);

export type InsertRepoExecution = InferInsertModel<typeof repoExecutions>;
export type SelectRepoExecution = InferSelectModel<typeof repoExecutions>;
