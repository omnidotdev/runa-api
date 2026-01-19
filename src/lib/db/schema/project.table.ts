import { relations } from "drizzle-orm";
import {
  boolean,
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

import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

/**
 * Project table.
 *
 * Projects belong directly to organizations (via organizationId from JWT claims).
 * No FK to settings table - settings are separate app preferences.
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
    // Organization ID from JWT claims - not a FK, just a reference
    organizationId: text("organization_id").notNull(),
    projectColumnId: uuid()
      .notNull()
      .references(() => projectColumns.id, { onDelete: "cascade" }),
    columnIndex: integer().notNull().default(0),
    // whether the project is publicly accessible (like Trello public boards)
    isPublic: boolean().notNull().default(false),
    // Counter for auto-incrementing task numbers within this project
    nextTaskNumber: integer("next_task_number").notNull().default(1),
    createdAt: generateDefaultDate(),
    updatedAt: generateDefaultDate(),
  },
  (table) => [
    uniqueIndex().on(table.id),
    index("project_organization_id_idx").on(table.organizationId),
    index().on(table.projectColumnId),
    unique().on(table.slug, table.organizationId),
  ],
);

export const projectRelations = relations(projects, ({ one, many }) => ({
  projectColumn: one(projectColumns, {
    fields: [projects.projectColumnId],
    references: [projectColumns.id],
  }),
  tasks: many(tasks),
  labels: many(labels),
  columns: many(columns),
}));

export type InsertProject = InferInsertModel<typeof projects>;
export type SelectProject = InferSelectModel<typeof projects>;
