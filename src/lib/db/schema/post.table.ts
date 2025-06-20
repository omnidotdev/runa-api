import { index, pgTable, text, uniqueIndex, uuid } from "drizzle-orm/pg-core";

import { generateDefaultDate, generateDefaultId } from "lib/db/util";
import { taskTable } from "./task.table";
import { userTable } from "./user.table";

import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

/**
 * Post table.
 */
export const postTable = pgTable(
  "post",
  {
    id: generateDefaultId(),
    title: text(),
    description: text(),
    authorId: uuid()
      .notNull()
      .references(() => userTable.id, {
        onDelete: "cascade",
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

export type InsertPost = InferInsertModel<typeof postTable>;
export type SelectPost = InferSelectModel<typeof postTable>;
