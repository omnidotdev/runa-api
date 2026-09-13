import { boolean, pgTable, uniqueIndex, uuid } from "drizzle-orm/pg-core";

import { generateDefaultDate, generateDefaultId } from "lib/db/util";
import { users } from "./user.table";

import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

/**
 * Notification preferences table.
 *
 * Per-user and user-global (not project scoped). A missing row means every
 * notification is enabled (opt-out model), so absence is treated as all-on
 */
export const notificationPreferences = pgTable(
  "notification_preference",
  {
    id: generateDefaultId(),
    userId: uuid()
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: "cascade" }),
    // email the user when they are assigned to a task
    emailTaskAssigned: boolean().notNull().default(true),
    createdAt: generateDefaultDate(),
    updatedAt: generateDefaultDate(),
  },
  (table) => [uniqueIndex().on(table.id)],
);

export type InsertNotificationPreference = InferInsertModel<
  typeof notificationPreferences
>;
export type SelectNotificationPreference = InferSelectModel<
  typeof notificationPreferences
>;
