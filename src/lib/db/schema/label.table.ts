import { relations } from "drizzle-orm";
import { index, pgTable, text, uniqueIndex, uuid } from "drizzle-orm/pg-core";

import { generateDefaultDate, generateDefaultId } from "lib/db/util";
import { projectTable } from "./project.table";

import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

/**
 * Label table.
 */
export const labelTable = pgTable(
  "label",
  {
    id: generateDefaultId(),
    name: text().notNull(),
    color: text().notNull(),
    projectId: uuid()
      .notNull()
      .references(() => projectTable.id, { onDelete: "cascade" }),
    createdAt: generateDefaultDate(),
    updatedAt: generateDefaultDate(),
  },
  (table) => [
    uniqueIndex().on(table.id),
    index().on(table.projectId),
    index().on(table.name),
  ],
);

export const labelRelations = relations(labelTable, ({ one }) => ({
  project: one(projectTable, {
    fields: [labelTable.projectId],
    references: [projectTable.id],
  }),
}));

export type InsertLabel = InferInsertModel<typeof labelTable>;
export type SelectLabel = InferSelectModel<typeof labelTable>;
