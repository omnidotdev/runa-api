import { relations } from "drizzle-orm";
import { index, pgTable, text, uniqueIndex, uuid } from "drizzle-orm/pg-core";

import { generateDefaultDate, generateDefaultId } from "lib/db/util";
import { projects } from "./project.table";

import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

/**
 * Label table.
 *
 * Labels can be scoped to either an organization (shared across all projects)
 * or a specific project. Exactly one of organizationId or projectId must be set.
 */
export const labels = pgTable(
  "label",
  {
    id: generateDefaultId(),
    name: text().notNull(),
    color: text().notNull(),
    icon: text(),
    // Exactly one of these must be set (enforced at application layer)
    projectId: uuid().references(() => projects.id, { onDelete: "cascade" }),
    organizationId: text(),
    createdAt: generateDefaultDate(),
    updatedAt: generateDefaultDate(),
  },
  (table) => [
    uniqueIndex().on(table.id),
    index().on(table.projectId),
    index().on(table.organizationId),
    index().on(table.name),
    uniqueIndex("label_org_name_unique").on(table.organizationId, table.name),
    uniqueIndex("label_project_name_unique").on(table.projectId, table.name),
  ],
);

export const labelRelations = relations(labels, ({ one }) => ({
  project: one(projects, {
    fields: [labels.projectId],
    references: [projects.id],
  }),
}));

export type InsertLabel = InferInsertModel<typeof labels>;
export type SelectLabel = InferSelectModel<typeof labels>;
