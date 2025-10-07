import { relations } from "drizzle-orm";
import {
  index,
  integer,
  pgTable,
  text,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { projectTable } from "./project.table";

import { generateDefaultDate, generateDefaultId } from "lib/db/util";

import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

/**
 * Column table.
 */
export const columnTable = pgTable(
  "column",
  {
    id: generateDefaultId(),
    emoji: text(),
    title: text().notNull(),
    projectId: uuid()
      .notNull()
      .references(() => projectTable.id, { onDelete: "cascade" }),
    index: integer().notNull().default(0),
    createdAt: generateDefaultDate(),
    updatedAt: generateDefaultDate(),
  },
  (table) => [uniqueIndex().on(table.id), index().on(table.projectId)],
);

export const columnRelations = relations(columnTable, ({ one }) => ({
  project: one(projectTable, {
    fields: [columnTable.projectId],
    references: [projectTable.id],
  }),
}));

export type InsertColumn = InferInsertModel<typeof columnTable>;
export type SelectColumn = InferSelectModel<typeof columnTable>;
