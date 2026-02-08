import {
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { generateDefaultDate, generateDefaultId } from "lib/db/util";
import { memberRole } from "./userOrganization.table";
import { users } from "./user.table";

import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

/**
 * Invitation status enum.
 */
export const invitationStatus = pgEnum("invitation_status", [
  "pending",
  "accepted",
  "expired",
  "revoked",
]);

/**
 * Invitation table.
 *
 * Tracks invitations for self-hosted team workspaces.
 * Each invitation has a unique token used in the invite link.
 */
export const invitations = pgTable(
  "invitation",
  {
    id: generateDefaultId(),
    /** Organization the invitation is for */
    organizationId: text().notNull(),
    /** User who created the invitation */
    inviterUserId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    /** Email of the invitee (optional, for display only) */
    email: text(),
    /** Role to assign when accepted */
    role: memberRole().notNull().default("member"),
    /** Unique token for the invite link */
    token: text().notNull().unique(),
    /** Invitation status */
    status: invitationStatus().notNull().default("pending"),
    /** When the invitation expires */
    expiresAt: timestamp({ withTimezone: true }).notNull(),
    createdAt: generateDefaultDate(),
  },
  (table) => [
    uniqueIndex().on(table.id),
    uniqueIndex().on(table.token),
    index().on(table.organizationId),
  ],
);

export type InsertInvitation = InferInsertModel<typeof invitations>;
export type SelectInvitation = InferSelectModel<typeof invitations>;
