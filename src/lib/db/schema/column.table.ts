import { index, pgTable, text, uniqueIndex, uuid } from "drizzle-orm/pg-core";
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
    title: text("title").notNull(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projectTable.id),
    createdAt: generateDefaultDate(),
    updatedAt: generateDefaultDate(),
  },
  (table) => [uniqueIndex().on(table.id), index().on(table.projectId)],
);

export type InsertColumn = InferInsertModel<typeof columnTable>;
export type SelectColumn = InferSelectModel<typeof columnTable>;
