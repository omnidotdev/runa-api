import { boolean, pgTable, text, uniqueIndex, uuid } from "drizzle-orm/pg-core";

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
    // cadence for assignment emails: "immediate" (default) or "digest" (batched
    // into one grouped email per window). App-level validation, not a pgEnum
    taskAssignedCadence: text().notNull().default("immediate"),
    // email the user when someone comments on a task they're involved in
    // (author, assignee, or prior commenter)
    emailTaskComment: boolean().notNull().default(true),
    // email the user when someone @mentions them in a task or comment
    emailTaskMention: boolean().notNull().default(true),
    // email the user when a task they're involved in moves to another project
    emailTaskMoved: boolean().notNull().default(true),
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
