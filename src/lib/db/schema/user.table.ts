import { pgTable, text, uniqueIndex, uuid } from "drizzle-orm/pg-core";

import { generateDefaultDate, generateDefaultId } from "lib/db/util";

import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

/**
 * User table.
 */
export const userTable = pgTable(
  "user",
  {
    id: generateDefaultId(),
    // external ID used by identity provider
    identityProviderId: uuid().notNull().unique(),
    name: text().notNull(),
    avatarUrl: text(),
    email: text().unique().notNull(),
    createdAt: generateDefaultDate(),
    updatedAt: generateDefaultDate(),
  },
  (table) => [
    uniqueIndex().on(table.id),
    uniqueIndex().on(table.identityProviderId),
  ],
);

export type InsertUser = InferInsertModel<typeof userTable>;
export type SelectUser = InferSelectModel<typeof userTable>;
