import { index, pgTable, text, uniqueIndex, uuid } from "drizzle-orm/pg-core";

import { generateDefaultDate } from "lib/db/util";

import { generateDefaultId } from "../util";
import { postTable } from "./post.table";
import { userTable } from "./user.table";

import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

/**
 * Emoji Table
 */
export const emojiTable = pgTable(
  "emoji",
  {
    id: generateDefaultId(),
    emoji: text(),
    postId: uuid()
      .notNull()
      .references(() => postTable.id, {
        onDelete: "cascade",
      }),
    userId: uuid()
      .notNull()
      .references(() => userTable.id, {
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

export type InsertEmoji = InferInsertModel<typeof emojiTable>;
export type SelectEmoji = InferSelectModel<typeof emojiTable>;
