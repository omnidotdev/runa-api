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

import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

/**
 * Organization settings table.
 *
 * Organization identity (name, slug) is owned by Gatekeeper (IDP).
 * Apps resolve org name/slug from JWT claims, not DB.
 * This table stores only app-specific settings per organization.
 *
 * Settings are auto-provisioned on first access (lazy creation).
 * 1:1 relationship with organizations.
 *
 * Tier/entitlements are managed by Aether at the organization level.
 * Use getOrganizationTier() from lib/entitlements for tier checks.
 */
export const settings = pgTable(
  "settings",
  {
    id: generateDefaultId(),
    // FK to IDP organization - 1:1 with orgs
    // Org name/slug resolved from JWT claims at runtime
    organizationId: text("organization_id").notNull().unique(),
    viewMode: varchar({ length: 10 }).notNull().default("board"),
    // Cached from Aether, synced via webhook
    subscriptionId: text("subscription_id"),
    billingAccountId: text("billing_account_id"),
    createdAt: generateDefaultDate(),
    updatedAt: generateDefaultDate(),
    // Soft delete fields - set when IDP organization is deleted
    deletedAt: timestamp("deleted_at"),
    deletionReason: text("deletion_reason"),
  },
  (table) => [
    uniqueIndex().on(table.id),
    index("settings_organization_id_idx").on(table.organizationId),
  ],
);

export const settingsRelations = relations(settings, () => ({}));

export type InsertSettings = InferInsertModel<typeof settings>;
export type SelectSettings = InferSelectModel<typeof settings>;
