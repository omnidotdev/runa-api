import { relations } from "drizzle-orm";
import {
  index,
  integer,
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
    emoji: text(),
    title: text().notNull(),
    projectId: uuid()
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    index: integer().notNull().default(0),
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
