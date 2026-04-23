import { relations } from "drizzle-orm";
import {
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { generateDefaultDate, generateDefaultId } from "lib/db/util";
import { repoExecutions } from "./repoExecution.table";
import { tasks } from "./task.table";

import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

/**
 * Task execution table. Tracks each agent attempt to execute a task.
 */
export const taskExecutions = pgTable(
  "task_execution",
  {
    id: generateDefaultId(),
    taskId: uuid()
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    // queued: waiting for pickup, planning: LLM producing execution plan,
    // in_progress: code work underway, completed: all repo executions done, failed: unrecoverable error
    status: varchar({ length: 20 }).notNull().default("queued"),
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
    index().on(table.taskId),
    index().on(table.status),
  ],
);

export const taskExecutionRelations = relations(
  taskExecutions,
  ({ one, many }) => ({
    task: one(tasks, {
      fields: [taskExecutions.taskId],
      references: [tasks.id],
    }),
    repoExecutions: many(repoExecutions),
  }),
);

export type InsertTaskExecution = InferInsertModel<typeof taskExecutions>;
export type SelectTaskExecution = InferSelectModel<typeof taskExecutions>;
