import { relations } from "drizzle-orm";
import {
  index,
  pgTable,
  primaryKey,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

import { generateDefaultDate } from "lib/db/util";
import { tasks } from "./task.table";
import { users } from "./user.table";

import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

/**
 * Assignee table.
 */
export const assignees = pgTable(
  "assignee",
  {
    taskId: uuid()
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: generateDefaultDate(),
    updatedAt: generateDefaultDate(),
    deletedAt: timestamp({
      precision: 6,
      mode: "string",
      withTimezone: true,
    }),
  },
  (table) => [
    primaryKey({ columns: [table.taskId, table.userId] }),
    unique().on(table.taskId, table.userId),
    index().on(table.taskId),
    index().on(table.userId),
  ],
);

export const assigneeRelations = relations(assignees, ({ one }) => ({
  task: one(tasks, {
    fields: [assignees.taskId],
    references: [tasks.id],
  }),
}));

export type InsertAssignee = InferInsertModel<typeof assignees>;
export type SelectAssignee = InferSelectModel<typeof assignees>;
