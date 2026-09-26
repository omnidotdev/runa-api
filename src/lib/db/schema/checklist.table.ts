import { relations } from "drizzle-orm";
import { index, pgTable, text, uniqueIndex, uuid } from "drizzle-orm/pg-core";

import { generateDefaultDate, generateDefaultId } from "lib/db/util";
import { checklistItems } from "./checklistItem.table";
import { tasks } from "./task.table";

import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

/**
 * Checklist table. A named list of items belonging to a task.
 */
export const checklists = pgTable(
  "checklist",
  {
    id: generateDefaultId(),
    taskId: uuid()
      .notNull()
      .references(() => tasks.id, {
        onDelete: "cascade",
      }),
    title: text().notNull(),
    // Fractional ordering key within the task (COLLATE "C", see migration)
    index: text().notNull(),
    createdAt: generateDefaultDate(),
    updatedAt: generateDefaultDate(),
  },
  (table) => [
    uniqueIndex().on(table.id),
    index().on(table.taskId),
    index().on(table.taskId, table.index),
  ],
);

export const checklistRelations = relations(checklists, ({ one, many }) => ({
  task: one(tasks, {
    fields: [checklists.taskId],
    references: [tasks.id],
  }),
  items: many(checklistItems),
}));

export type InsertChecklist = InferInsertModel<typeof checklists>;
export type SelectChecklist = InferSelectModel<typeof checklists>;
