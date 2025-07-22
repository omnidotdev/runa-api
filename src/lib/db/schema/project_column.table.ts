import {
  index,
  integer,
  pgTable,
  text,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { generateDefaultDate, generateDefaultId } from "lib/db/util";
import { workspaceTable } from "./workspace.table";

import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

/**
 * Project column table.
 */
export const projectColumnTable = pgTable(
  "project_column",
  {
    id: generateDefaultId(),
    emoji: text(),
    title: text().notNull(),
    workspaceId: uuid()
      .notNull()
      .references(() => workspaceTable.id, { onDelete: "cascade" }),
    index: integer().notNull().default(0),
    createdAt: generateDefaultDate(),
    updatedAt: generateDefaultDate(),
  },
  (table) => [uniqueIndex().on(table.id), index().on(table.workspaceId)],
);

export type InsertProjectColumn = InferInsertModel<typeof projectColumnTable>;
export type SelectProjectColumn = InferSelectModel<typeof projectColumnTable>;
