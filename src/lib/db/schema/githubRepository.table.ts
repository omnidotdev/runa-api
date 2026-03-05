import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { generateDefaultDate, generateDefaultId } from "lib/db/util";
import { projects } from "./project.table";

import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

/**
 * GitHub repository table.
 *
 * Links a GitHub repository to a Runa project for code execution.
 * Each project can have one connected repository.
 */
export const githubRepositories = pgTable(
  "github_repository",
  {
    id: generateDefaultId(),
    organizationId: text().notNull(),
    projectId: uuid()
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    /** Full repository name (e.g., "omnidotdev/runa-api"). */
    repoFullName: text().notNull(),
    /** GitHub repository numeric ID. */
    repoId: integer().notNull(),
    /** Default branch name (e.g., "main"). */
    defaultBranch: text().notNull().default("main"),
    /** Whether this repository connection is active. */
    enabled: boolean().notNull().default(true),
    createdAt: generateDefaultDate(),
    updatedAt: generateDefaultDate(),
  },
  (table) => [
    uniqueIndex().on(table.id),
    index("github_repository_organization_id_idx").on(table.organizationId),
    uniqueIndex("github_repository_project_id_unique").on(table.projectId),
    index("github_repository_repo_full_name_idx").on(table.repoFullName),
  ],
);

export const githubRepositoryRelations = relations(
  githubRepositories,
  ({ one }) => ({
    project: one(projects, {
      fields: [githubRepositories.projectId],
      references: [projects.id],
    }),
  }),
);

export type InsertGithubRepository = InferInsertModel<
  typeof githubRepositories
>;
export type SelectGithubRepository = InferSelectModel<
  typeof githubRepositories
>;
