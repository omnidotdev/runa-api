import { index, pgTable, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { generateDefaultDate, generateDefaultId } from "lib/db/util";
import { labelTable } from "./label.table";
import { taskTable } from "./task.table";

import type { InferInsertModel, InferSelectModel } from "drizzle-orm/table";

export const taskLabelTable = pgTable(
  "task_label",
  {
    id: generateDefaultId(),
    taskId: uuid()
      .notNull()
      .references(() => taskTable.id, { onDelete: "cascade" }),
    labelId: uuid()
      .notNull()
      .references(() => labelTable.id, { onDelete: "cascade" }),
    createdAt: generateDefaultDate(),
    updatedAt: generateDefaultDate(),
  },
  (table) => [
    uniqueIndex().on(table.id),
    index().on(table.taskId),
    index().on(table.labelId),
  ],
);

export type InsertTaskLabel = InferInsertModel<typeof taskLabelTable>;
export type SelectTaskLabel = InferSelectModel<typeof taskLabelTable>;
