import { relations } from "drizzle-orm";
import { index, pgTable, text, uniqueIndex, uuid } from "drizzle-orm/pg-core";

import { generateDefaultDate, generateDefaultId } from "lib/db/util";
import { posts } from "./post.table";
import { users } from "./user.table";

import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

/**
 * Emoji Table
 */
export const emojis = pgTable(
  "emoji",
  {
    id: generateDefaultId(),
    emoji: text(),
    postId: uuid()
      .notNull()
      .references(() => posts.id, {
        onDelete: "cascade",
      }),
    userId: uuid()
      .notNull()
      .references(() => users.id, {
        onDelete: "cascade",
      }),
    createdAt: generateDefaultDate(),
    updatedAt: generateDefaultDate(),
  },
  (table) => [
    uniqueIndex().on(table.id),
    index().on(table.postId),
    index().on(table.userId),
  ],
);

export const emojiRelations = relations(emojis, ({ one }) => ({
  post: one(posts, {
    fields: [emojis.postId],
    references: [posts.id],
  }),
}));

export type InsertEmoji = InferInsertModel<typeof emojis>;
export type SelectEmoji = InferSelectModel<typeof emojis>;
