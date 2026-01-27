import { relations } from "drizzle-orm";
import { index, pgTable, primaryKey, unique, uuid } from "drizzle-orm/pg-core";

import { generateDefaultDate } from "lib/db/util";
import { projectLabels } from "./projectLabel.table";
import { projects } from "./project.table";

import type { InferInsertModel, InferSelectModel } from "drizzle-orm/table";

/**
 * Project-to-project-label join table.
 *
 * Links projects to their assigned project labels.
 */
export const projectProjectLabels = pgTable(
  "project_project_label",
  {
    projectId: uuid()
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    projectLabelId: uuid()
      .notNull()
      .references(() => projectLabels.id, { onDelete: "cascade" }),
    createdAt: generateDefaultDate(),
  },
  (table) => [
    primaryKey({ columns: [table.projectId, table.projectLabelId] }),
    unique().on(table.projectId, table.projectLabelId),
    index().on(table.projectId),
    index().on(table.projectLabelId),
  ],
);

export const projectProjectLabelRelations = relations(
  projectProjectLabels,
  ({ one }) => ({
    project: one(projects, {
      fields: [projectProjectLabels.projectId],
      references: [projects.id],
    }),
    projectLabel: one(projectLabels, {
      fields: [projectProjectLabels.projectLabelId],
      references: [projectLabels.id],
    }),
  }),
);

export type InsertProjectProjectLabel = InferInsertModel<
  typeof projectProjectLabels
>;
export type SelectProjectProjectLabel = InferSelectModel<
  typeof projectProjectLabels
>;
