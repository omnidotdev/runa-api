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
import { columnTable } from "./column.table";
import { postTable } from "./post.table";
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
    authorId: uuid().references(() => userTable.id, { onDelete: "set null" }),
    projectId: uuid()
      .notNull()
      .references(() => projectTable.id, { onDelete: "cascade" }),
    columnId: uuid()
      .notNull()
      .references(() => columnTable.id, { onDelete: "cascade" }),
    columnIndex: integer().notNull().default(0),
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
    index().on(table.authorId),
    index().on(table.projectId),
    index().on(table.columnId),
  ],
);

export const taskRelations = relations(taskTable, ({ one, many }) => ({
  project: one(projectTable, {
    fields: [taskTable.projectId],
    references: [projectTable.id],
  }),
  posts: many(postTable),
}));

export type InsertTask = InferInsertModel<typeof taskTable>;
export type SelectTask = InferSelectModel<typeof taskTable>;
