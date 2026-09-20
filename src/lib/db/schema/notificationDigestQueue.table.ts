/**
 * Notification digest queue.
 *
 * Buffers task-assignment notifications for users whose cadence preference is
 * "digest" so they receive a single grouped email per window instead of one per
 * assignment. A background poller claims due rows (FOR UPDATE SKIP LOCKED so
 * multiple API replicas never double-send a non-idempotent email), groups them
 * by recipient, sends one digest, and deletes them.
 */

import { index, jsonb, pgTable, timestamp, uuid } from "drizzle-orm/pg-core";

import { generateDefaultDate, generateDefaultId } from "lib/db/util";
import { users } from "./user.table";

import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

export const notificationDigestQueue = pgTable(
  "notification_digest_queue",
  {
    id: generateDefaultId(),
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    /** Rendered digest line data (recipient, task title/key/url, links) */
    payload: jsonb().notNull(),
    /** Earliest time this item may be sent (enqueue time + digest window) */
    sendAfter: timestamp("send_after", { withTimezone: true })
      .notNull()
      .defaultNow(),
    createdAt: generateDefaultDate(),
  },
  (table) => [
    index("notification_digest_queue_user_idx").on(table.userId),
    index("notification_digest_queue_send_after_idx").on(table.sendAfter),
  ],
);

export type InsertNotificationDigestQueue = InferInsertModel<
  typeof notificationDigestQueue
>;
export type SelectNotificationDigestQueue = InferSelectModel<
  typeof notificationDigestQueue
>;
