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
import { checklists } from "./checklist.table";

import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

/**
 * Checklist item table. A single toggleable line within a checklist.
 */
export const checklistItems = pgTable(
  "checklist_item",
  {
    id: generateDefaultId(),
    checklistId: uuid()
      .notNull()
      .references(() => checklists.id, {
        onDelete: "cascade",
      }),
    content: text().notNull(),
    isDone: boolean().notNull().default(false),
    // Fractional ordering key within the checklist (COLLATE "C", see migration)
    index: text().notNull(),
    createdAt: generateDefaultDate(),
    updatedAt: generateDefaultDate(),
  },
  (table) => [
    uniqueIndex().on(table.id),
    index().on(table.checklistId),
    index().on(table.checklistId, table.index),
  ],
);

export const checklistItemRelations = relations(checklistItems, ({ one }) => ({
  checklist: one(checklists, {
    fields: [checklistItems.checklistId],
    references: [checklists.id],
  }),
}));

export type InsertChecklistItem = InferInsertModel<typeof checklistItems>;
export type SelectChecklistItem = InferSelectModel<typeof checklistItems>;
