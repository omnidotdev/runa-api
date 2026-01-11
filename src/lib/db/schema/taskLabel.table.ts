import { relations } from "drizzle-orm";
import { index, pgTable, primaryKey, unique, uuid } from "drizzle-orm/pg-core";

import { generateDefaultDate } from "lib/db/util";
import { labels } from "./label.table";
import { tasks } from "./task.table";

import type { InferInsertModel, InferSelectModel } from "drizzle-orm/table";

/**
 * Task label table.
 */
export const taskLabels = pgTable(
  "task_label",
  {
    taskId: uuid()
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    labelId: uuid()
      .notNull()
      .references(() => labels.id, { onDelete: "cascade" }),
    createdAt: generateDefaultDate(),
    updatedAt: generateDefaultDate(),
  },
  (table) => [
    primaryKey({ columns: [table.taskId, table.labelId] }),
    unique().on(table.taskId, table.labelId),
    index().on(table.taskId),
    index().on(table.labelId),
  ],
);

export const taskLabelRelations = relations(taskLabels, ({ one }) => ({
  task: one(tasks, {
    fields: [taskLabels.taskId],
    references: [tasks.id],
  }),
  label: one(labels, {
    fields: [taskLabels.labelId],
    references: [labels.id],
  }),
}));

export type InsertTaskLabel = InferInsertModel<typeof taskLabels>;
export type SelectTaskLabel = InferSelectModel<typeof taskLabels>;
