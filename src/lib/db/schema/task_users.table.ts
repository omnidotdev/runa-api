import { index, pgTable, primaryKey, uuid } from "drizzle-orm/pg-core";
import { taskTable } from "./task.table";
import { userTable } from "./user.table";

import { generateDefaultDate } from "lib/db/util";

import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

/**
 * Task users junction table.
 */
export const taskUserTable = pgTable(
  "task_user",
  {
    taskId: uuid("task_id")
      .notNull()
      .references(() => taskTable.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),
    createdAt: generateDefaultDate(),
  },
  (table) => [
    primaryKey({ columns: [table.taskId, table.userId] }),
    index().on(table.userId),
    index().on(table.taskId),
  ],
);

export type InsertTaskUser = InferInsertModel<typeof taskUserTable>;
export type SelectTaskUser = InferSelectModel<typeof taskUserTable>;
