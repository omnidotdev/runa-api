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
import { taskTable } from "./task.table";
import { userTable } from "./user.table";

import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

/**
 * Assignee table.
 */
export const assigneeTable = pgTable(
  "assignee",
  {
    taskId: uuid()
      .notNull()
      .references(() => taskTable.id, { onDelete: "cascade" }),
    userId: uuid()
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),
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

export const assigneeRelations = relations(assigneeTable, ({ one }) => ({
  task: one(taskTable, {
    fields: [assigneeTable.taskId],
    references: [taskTable.id],
  }),
}));

export type InsertAssignee = InferInsertModel<typeof assigneeTable>;
export type SelectAssignee = InferSelectModel<typeof assigneeTable>;
