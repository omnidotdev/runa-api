import {
  jsonb,
  pgTable,
  text,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { columnTable } from "./column.table";

import { generateDefaultDate, generateDefaultId } from "lib/db/util";

import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

/**
 * Task table.
 */
export const taskTable = pgTable(
  "task",
  {
    id: generateDefaultId(),
    content: text("content").notNull(),
    description: text("description").notNull(),
    priority: varchar("priority", { length: 10 }).notNull().default("medium"),
    columnId: uuid("column_id")
      .notNull()
      .references(() => columnTable.id),
    assignees: jsonb("assignees").$type<{ userId: string }[]>().default([]),
    labels: jsonb("labels").$type<string[]>().default([]),
    dueDate: text("due_date"),
    createdAt: generateDefaultDate(),
    updatedAt: generateDefaultDate(),
  },
  (table) => [uniqueIndex().on(table.id)],
);

export type InsertTask = InferInsertModel<typeof taskTable>;
export type SelectTask = InferSelectModel<typeof taskTable>;
