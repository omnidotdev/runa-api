import { pgTable, text, uniqueIndex, uuid } from "drizzle-orm/pg-core";

import { generateDefaultDate, generateDefaultId } from "lib/db/util";
import { userTable } from "./user.table";

import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

/**
 * Assignee table.
 */
export const assigneeTable = pgTable(
  "assignee",
  {
    id: generateDefaultId(),
    userId: uuid("user_id")
      .notNull()
      .references(() => userTable.id),
    name: text("name").notNull(),
    avatarUrl: text("avatar_url"),
    createdAt: generateDefaultDate(),
    updatedAt: generateDefaultDate(),
  },
  (table) => [uniqueIndex().on(table.id), uniqueIndex().on(table.userId)],
);

export type InsertAssignee = InferInsertModel<typeof assigneeTable>;
export type SelectAssignee = InferSelectModel<typeof assigneeTable>;
