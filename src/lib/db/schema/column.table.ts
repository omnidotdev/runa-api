import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  pgTable,
  text,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { generateDefaultDate, generateDefaultId } from "lib/db/util";
import { projects } from "./project.table";

import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

/**
 * Column table.
 */
export const columns = pgTable(
  "column",
  {
    id: generateDefaultId(),
    icon: text(),
    title: text().notNull(),
    // Marks the column whose tasks count as done (one per project by
    // convention). Drives the calendar/board done + overdue indicators
    isDone: boolean().notNull().default(false),
    projectId: uuid()
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    index: text().notNull(),
    createdAt: generateDefaultDate(),
    updatedAt: generateDefaultDate(),
  },
  (table) => [
    uniqueIndex().on(table.id),
    index().on(table.projectId),
    index().on(table.projectId, table.index),
  ],
);

export const columnRelations = relations(columns, ({ one }) => ({
  project: one(projects, {
    fields: [columns.projectId],
    references: [projects.id],
  }),
}));

export type InsertColumn = InferInsertModel<typeof columns>;
export type SelectColumn = InferSelectModel<typeof columns>;
