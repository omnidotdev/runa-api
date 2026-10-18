/**
 * Calendar feed token table. Publishes a read-only iCalendar feed that external
 * calendar clients (which cannot send auth headers) subscribe to by polling a
 * URL. The credential therefore lives in the feed URL as a dedicated capability
 * token: read-only, revocable, and stored only as a SHA-256 hash (the plaintext
 * `runa_cal_...` is shown once on creation, embedded in the feed URL).
 *
 * A token is scoped to EXACTLY ONE of: a project (`projectId`, a project admin's
 * board feed) or a user (`userId`, a member's own "my dated tasks across the
 * workspace" feed). Hidden from auto-CRUD (SmartTag `-*`); managed only through
 * the authorized mutations and resolved by the public feed route.
 */

import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { generateDefaultDate, generateDefaultId } from "lib/db/util";
import { projects } from "./project.table";
import { users } from "./user.table";

import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

export const calendarFeedToken = pgTable(
  "calendar_feed_token",
  {
    id: generateDefaultId(),
    /** Owning workspace (organization id from JWT claims; not a FK) */
    organizationId: text("organization_id").notNull(),
    /** Project whose dated tasks the feed publishes (null for a user feed) */
    projectId: uuid("project_id").references(() => projects.id, {
      onDelete: "cascade",
    }),
    /** User whose assigned dated tasks the feed publishes (null for a project feed) */
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
    /** SHA-256 hex of the plaintext token; the plaintext is never stored */
    tokenHash: text("token_hash").notNull(),
    /** Identity-provider id of the creator */
    createdBy: text("created_by").notNull(),
    lastUsedAt: timestamp("last_used_at", {
      precision: 6,
      mode: "string",
      withTimezone: true,
    }),
    revokedAt: timestamp("revoked_at", {
      precision: 6,
      mode: "string",
      withTimezone: true,
    }),
    createdAt: generateDefaultDate(),
  },
  (table) => [
    index("calendar_feed_token_token_hash_idx").on(table.tokenHash),
    index("calendar_feed_token_project_id_idx").on(table.projectId),
    index("calendar_feed_token_user_id_idx").on(table.userId),
  ],
);

export type InsertCalendarFeedToken = InferInsertModel<
  typeof calendarFeedToken
>;
export type SelectCalendarFeedToken = InferSelectModel<
  typeof calendarFeedToken
>;
