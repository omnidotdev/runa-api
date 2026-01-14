import { relations } from "drizzle-orm";
import {
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

import { generateDefaultDate, generateDefaultId } from "lib/db/util";
import { projects } from "./project.table";
import { projectColumns } from "./projectColumn.table";

import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

/**
 * Workspace table.
 *
 * Organization identity (name, slug) is owned by Gatekeeper (IDP).
 * Apps resolve org name/slug from JWT claims, not DB.
 * This table stores only app-specific settings.
 *
 * Tier/entitlements are managed by Aether at the organization level.
 * Use getOrganizationTier() from lib/entitlements for tier checks.
 */
export const workspaces = pgTable(
  "workspace",
  {
    id: generateDefaultId(),
    // FK to IDP organization - workspaces are 1:1 with orgs
    // Org name/slug resolved from JWT claims at runtime
    organizationId: text("organization_id").notNull().unique(),
    viewMode: varchar({ length: 10 }).notNull().default("board"),
    // Cached from Aether, synced via webhook
    subscriptionId: text(),
    billingAccountId: text(),
    createdAt: generateDefaultDate(),
    updatedAt: generateDefaultDate(),
    // Soft delete fields - set when IDP organization is deleted
    deletedAt: timestamp("deleted_at"),
    deletionReason: text("deletion_reason"),
  },
  (table) => [
    uniqueIndex().on(table.id),
    index("workspace_organization_id_idx").on(table.organizationId),
  ],
);

export const workspaceRelations = relations(workspaces, ({ many }) => ({
  projects: many(projects),
  projectColumns: many(projectColumns),
}));

export type InsertWorkspace = InferInsertModel<typeof workspaces>;
export type SelectWorkspace = InferSelectModel<typeof workspaces>;
