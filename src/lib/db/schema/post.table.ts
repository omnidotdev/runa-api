import { relations } from "drizzle-orm";
import { index, pgTable, text, uniqueIndex, uuid } from "drizzle-orm/pg-core";

import { generateDefaultDate, generateDefaultId } from "lib/db/util";
import { emojis } from "./emoji.table";
import { tasks } from "./task.table";
import { users } from "./user.table";

import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

/**
 * Post table.
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
    createdAt: generateDefaultDate(),
    updatedAt: generateDefaultDate(),
  },
  (table) => [
    uniqueIndex().on(table.id),
    index().on(table.authorId),
    index().on(table.taskId),
  ],
);

export const postRelations = relations(posts, ({ one, many }) => ({
  task: one(tasks, {
    fields: [posts.taskId],
    references: [tasks.id],
  }),
  emojis: many(emojis),
}));

export type InsertPost = InferInsertModel<typeof posts>;
export type SelectPost = InferSelectModel<typeof posts>;
