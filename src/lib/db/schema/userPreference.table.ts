import {
  index,
  pgTable,
  text,
  unique,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { generateDefaultDate, generateDefaultId } from "lib/db/util";
import { projects } from "./project.table";
import { users } from "./user.table";

import type { InferInsertModel, InferSelectModel } from "drizzle-orm/table";

/**
 * User preferences table.
 */
export const userPreferences = pgTable(
  "user_preference",
  {
    id: generateDefaultId(),
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    projectId: uuid()
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    hiddenColumnIds: text().array().notNull().default([]),
    viewMode: varchar({ length: 10 }).notNull().default("board"),
    color: varchar({ length: 24 }),
    createdAt: generateDefaultDate(),
    updatedAt: generateDefaultDate(),
  },
  (table) => [
    uniqueIndex().on(table.id),
    index().on(table.userId),
    index().on(table.projectId),
    unique().on(table.userId, table.projectId),
  ],
);

export type InsertUserPreference = InferInsertModel<typeof userPreferences>;
export type SelectUserPreference = InferSelectModel<typeof userPreferences>;
