import { relations } from "drizzle-orm";
import { index, pgTable, text, uniqueIndex, uuid } from "drizzle-orm/pg-core";

import { generateDefaultDate, generateDefaultId } from "lib/db/util";
import { taskTable } from "./task.table";
import { userTable } from "./user.table";

import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { emojiTable } from "./emoji.table";

/**
 * Post table.
 */
export const postTable = pgTable(
  "post",
  {
    id: generateDefaultId(),
    title: text(),
    description: text(),
    authorId: uuid().references(() => userTable.id, {
      onDelete: "set null",
    }),
    taskId: uuid()
      .notNull()
      .references(() => taskTable.id, {
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

export const postRelations = relations(postTable, ({ one, many }) => ({
  task: one(taskTable, {
    fields: [postTable.taskId],
    references: [taskTable.id],
  }),
  emojis: many(emojiTable),
}));

export type InsertPost = InferInsertModel<typeof postTable>;
export type SelectPost = InferSelectModel<typeof postTable>;
