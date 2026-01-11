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

import { generateDefaultDate, generateDefaultId } from "lib/db/util";
import { columns } from "./column.table";
import { labels } from "./label.table";
import { projectColumns } from "./projectColumn.table";
import { tasks } from "./task.table";
import { workspaces } from "./workspace.table";

import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

/**
 * Project table.
 */
export const projects = pgTable(
  "project",
  {
    id: generateDefaultId(),
    name: text().notNull(),
    description: text(),
    prefix: varchar({ length: 10 }),
    slug: text()
      // TODO
      // .generatedAlwaysAs((): SQL => generateSlug(projects.name))
      .notNull(),
    workspaceId: uuid()
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    projectColumnId: uuid()
      .notNull()
      .references(() => projectColumns.id, { onDelete: "cascade" }),
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

export const projectRelations = relations(projects, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [projects.workspaceId],
    references: [workspaces.id],
  }),
  tasks: many(tasks),
  labels: many(labels),
  columns: many(columns),
}));

export type InsertProject = InferInsertModel<typeof projects>;
export type SelectProject = InferSelectModel<typeof projects>;
