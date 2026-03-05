import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import { generateDefaultDate, generateDefaultId } from "lib/db/util";

import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

/**
 * GitHub App installation table.
 *
 * Stores the GitHub App installation for each organization.
 * One installation per organization (unique constraint).
 * Populated via GitHub webhook when the App is installed.
 */
export const githubInstallations = pgTable(
  "github_installation",
  {
    id: generateDefaultId(),
    organizationId: text().notNull(),
    /** GitHub App installation ID. */
    installationId: integer().notNull(),
    /** GitHub organization login (e.g., "omnidotdev"). */
    githubOrgLogin: text().notNull(),
    /** GitHub organization numeric ID. */
    githubOrgId: integer().notNull(),
    /** Whether this installation is active. Set to false on uninstall. */
    enabled: boolean().notNull().default(true),
    createdAt: generateDefaultDate(),
    updatedAt: generateDefaultDate(),
  },
  (table) => [
    uniqueIndex().on(table.id),
    uniqueIndex("github_installation_organization_id_unique").on(
      table.organizationId,
    ),
    index("github_installation_installation_id_idx").on(table.installationId),
  ],
);

export const githubInstallationRelations = relations(
  githubInstallations,
  () => ({}),
);

export type InsertGithubInstallation = InferInsertModel<
  typeof githubInstallations
>;
export type SelectGithubInstallation = InferSelectModel<
  typeof githubInstallations
>;
