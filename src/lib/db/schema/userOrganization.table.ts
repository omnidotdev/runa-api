import { relations } from "drizzle-orm";
import {
  index,
  pgEnum,
  pgTable,
  text,
  unique,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { generateDefaultDate, generateDefaultId } from "lib/db/util";
import { users } from "./user.table";

import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

/**
 * Organization type enum.
 */
export const organizationType = pgEnum("organization_type", [
  "personal",
  "team",
]);

/**
 * Member role enum.
 */
export const memberRole = pgEnum("member_role", ["owner", "admin", "member"]);

/**
 * User organization membership table.
 *
 * Persists organization claims from the IDP for:
 * - Offline access (when IDP is temporarily unavailable)
 * - Query optimization (find all orgs a user belongs to)
 * - Audit trail (track membership changes over time)
 */
export const userOrganizations = pgTable(
  "user_organization",
  {
    id: generateDefaultId(),
    /** Local user ID (FK to users table) */
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    /** IDP organization ID */
    organizationId: text().notNull(),
    /** Organization slug (cached from IDP) */
    slug: text().notNull(),
    /** Organization name (cached from IDP, for display) */
    name: text(),
    /** Organization type */
    type: organizationType().notNull().default("team"),
    /** User's role in the organization */
    role: memberRole().notNull().default("member"),
    /** When the membership was synced from IDP */
    syncedAt: generateDefaultDate(),
    createdAt: generateDefaultDate(),
    updatedAt: generateDefaultDate(),
  },
  (table) => [
    uniqueIndex().on(table.id),
    unique().on(table.userId, table.organizationId),
    index().on(table.userId),
    index().on(table.organizationId),
  ],
);

/**
 * User organization relations.
 */
export const userOrganizationRelations = relations(
  userOrganizations,
  ({ one }) => ({
    user: one(users, {
      fields: [userOrganizations.userId],
      references: [users.id],
    }),
  }),
);

export type InsertUserOrganization = InferInsertModel<typeof userOrganizations>;
export type SelectUserOrganization = InferSelectModel<typeof userOrganizations>;
