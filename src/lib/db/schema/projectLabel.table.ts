import { index, pgTable, text, uniqueIndex } from "drizzle-orm/pg-core";

import { generateDefaultDate, generateDefaultId } from "lib/db/util";

import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

/**
 * Project label table.
 *
 * Organization-level labels for categorizing projects
 * (e.g., "Platform", "Mobile", "Infrastructure").
 */
export const projectLabels = pgTable(
  "project_label",
  {
    id: generateDefaultId(),
    name: text().notNull(),
    color: text().notNull(),
    icon: text(),
    organizationId: text().notNull(),
    createdAt: generateDefaultDate(),
    updatedAt: generateDefaultDate(),
  },
  (table) => [
    uniqueIndex().on(table.id),
    index().on(table.organizationId),
    uniqueIndex("project_label_org_name_unique").on(
      table.organizationId,
      table.name,
    ),
  ],
);

export type InsertProjectLabel = InferInsertModel<typeof projectLabels>;
export type SelectProjectLabel = InferSelectModel<typeof projectLabels>;
