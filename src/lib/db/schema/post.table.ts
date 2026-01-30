import { relations } from "drizzle-orm";
import { index, pgTable, text, uniqueIndex, uuid } from "drizzle-orm/pg-core";

import { generateDefaultDate, generateDefaultId } from "lib/db/util";
import { emojis } from "./emoji.table";
import { tasks } from "./task.table";
import { users } from "./user.table";

import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import type { AnyPgColumn } from "drizzle-orm/pg-core";

/**
 * Post table.
 *
 * Supports threaded replies via the parentId column (flat 1-level threading).
 * When parentId is null, the post is a top-level comment.
 * When parentId is set, the post is a reply to that comment.
 */
export const posts = pgTable(
  "post",
  {
    id: generateDefaultId(),
    title: text(),
    description: text(),
    authorId: uuid().references(() => users.id, {
      onDelete: "set null",
    }),
    taskId: uuid()
      .notNull()
      .references(() => tasks.id, {
        onDelete: "cascade",
      }),
    /**
     * Parent comment ID for flat threading (1-level deep).
     * - null = top-level comment
     * - set = reply to parent comment
     */
    parentId: uuid().references((): AnyPgColumn => posts.id, {
      onDelete: "cascade",
    }),
    createdAt: generateDefaultDate(),
    updatedAt: generateDefaultDate(),
  },
  (table) => [
    uniqueIndex().on(table.id),
    index().on(table.authorId),
    index().on(table.taskId),
    index().on(table.parentId),
  ],
);

export const postRelations = relations(posts, ({ one, many }) => ({
  task: one(tasks, {
    fields: [posts.taskId],
    references: [tasks.id],
  }),
  /** Author of the comment (null for agent-authored comments). */
  author: one(users, {
    fields: [posts.authorId],
    references: [users.id],
  }),
  emojis: many(emojis),
  /** Parent comment (if this is a reply). */
  parent: one(posts, {
    fields: [posts.parentId],
    references: [posts.id],
    relationName: "replies",
  }),
  /** Replies to this comment. */
  replies: many(posts, {
    relationName: "replies",
  }),
}));

export type InsertPost = InferInsertModel<typeof posts>;
export type SelectPost = InferSelectModel<typeof posts>;
