import { relations } from "drizzle-orm";
import {
  index,
  integer,
  pgTable,
  text,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import { generateDefaultDate, generateDefaultId } from "lib/db/util";
import { projects } from "./project.table";

import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

/**
 * Project column table.
 *
 * Project columns are organization-level templates for categorizing projects.
 * Referenced directly by organizationId from JWT claims.
 */
export const projectColumns = pgTable(
  "project_column",
  {
    id: generateDefaultId(),
    emoji: text(),
    title: text().notNull(),
    // Organization ID from JWT claims - not a FK, just a reference
    organizationId: text("organization_id").notNull(),
    index: integer().notNull().default(0),
    createdAt: generateDefaultDate(),
    updatedAt: generateDefaultDate(),
  },
  (table) => [
    uniqueIndex().on(table.id),
    index("project_column_organization_id_idx").on(table.organizationId),
    index().on(table.organizationId, table.index),
    // Unique constraint for race condition safety during lazy init
    uniqueIndex("project_column_organization_title_unique").on(
      table.organizationId,
      table.title,
    ),
  ],
);

export const projectColumnRelations = relations(projectColumns, ({ many }) => ({
  projects: many(projects),
}));

export type InsertProjectColumn = InferInsertModel<typeof projectColumns>;
export type SelectProjectColumn = InferSelectModel<typeof projectColumns>;
