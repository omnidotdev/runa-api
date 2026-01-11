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
import { workspaces } from "./workspace.table";

import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

/**
 * Project column table.
 */
export const projectColumns = pgTable(
  "project_column",
  {
    id: generateDefaultId(),
    emoji: text(),
    title: text().notNull(),
    workspaceId: uuid()
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    index: integer().notNull().default(0),
    createdAt: generateDefaultDate(),
    updatedAt: generateDefaultDate(),
  },
  (table) => [
    uniqueIndex().on(table.id),
    index().on(table.workspaceId),
    index().on(table.workspaceId, table.index),
  ],
);

export const projectColumnRelations = relations(projectColumns, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [projectColumns.workspaceId],
    references: [workspaces.id],
  }),
}));

export type InsertProjectColumn = InferInsertModel<typeof projectColumns>;
export type SelectProjectColumn = InferSelectModel<typeof projectColumns>;
