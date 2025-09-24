import { relations } from "drizzle-orm";
import {
  index,
  integer,
  pgTable,
  text,
  unique,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { workspaceTable } from "./workspace.table";

import { generateDefaultDate, generateDefaultId } from "lib/db/util";
import { projectColumnTable } from "./project_column.table";
import { taskTable } from "./task.table";

import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

/**
 * Project table.
 */
export const projectTable = pgTable(
  "project",
  {
    id: generateDefaultId(),
    name: text().notNull(),
    description: text(),
    prefix: varchar({ length: 10 }),
    slug: text()
      // TODO
      // .generatedAlwaysAs((): SQL => generateSlug(projectTable.name))
      .notNull(),
    workspaceId: uuid()
      .notNull()
      .references(() => workspaceTable.id, { onDelete: "cascade" }),
    projectColumnId: uuid()
      .notNull()
      .references(() => projectColumnTable.id, { onDelete: "cascade" }),
    columnIndex: integer().notNull().default(0),
    createdAt: generateDefaultDate(),
    updatedAt: generateDefaultDate(),
  },
  (table) => [
    uniqueIndex().on(table.id),
    index().on(table.workspaceId),
    index().on(table.projectColumnId),
    unique().on(table.slug, table.workspaceId),
  ],
);

export const projectRelations = relations(projectTable, ({ one, many }) => ({
  workspace: one(workspaceTable, {
    fields: [projectTable.workspaceId],
    references: [workspaceTable.id],
  }),
  tasks: many(taskTable),
}));

export type InsertProject = InferInsertModel<typeof projectTable>;
export type SelectProject = InferSelectModel<typeof projectTable>;
