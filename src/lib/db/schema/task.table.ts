import {
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { generateDefaultDate, generateDefaultId } from "lib/db/util";
import { columnTable } from "./column.table";
import { projectTable } from "./project.table";
import { userTable } from "./user.table";

import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

/**
 * Task table.
 */
export const taskTable = pgTable(
  "task",
  {
    id: generateDefaultId(),
    content: text().notNull(),
    description: text().notNull(),
    priority: varchar({ length: 10 }).notNull().default("medium"),
    authorId: uuid()
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),
    projectId: uuid()
      .notNull()
      .references(() => projectTable.id, { onDelete: "cascade" }),
    columnId: uuid()
      .notNull()
      .references(() => columnTable.id, { onDelete: "cascade" }),
    labels: jsonb().$type<string[]>().default([]),
    dueDate: timestamp({
      precision: 6,
      mode: "string",
      withTimezone: true,
    }),
    createdAt: generateDefaultDate(),
    updatedAt: generateDefaultDate(),
  },
  (table) => [
    uniqueIndex().on(table.id),
    index().on(table.columnId),
    index().on(table.projectId),
  ],
);

export type InsertTask = InferInsertModel<typeof taskTable>;
export type SelectTask = InferSelectModel<typeof taskTable>;
