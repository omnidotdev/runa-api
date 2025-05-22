import { pgTable, primaryKey, uuid } from "drizzle-orm/pg-core";
import { projectTable } from "./project.table";
import { userTable } from "./user.table";

import { generateDefaultDate } from "lib/db/util";

import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

/**
 * Project users junction table.
 */
export const projectUserTable = pgTable(
  "project_user",
  {
    projectId: uuid("project_id")
      .notNull()
      .references(() => projectTable.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),
    createdAt: generateDefaultDate(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.projectId, table.userId] }),
  }),
);

export type InsertProjectUser = InferInsertModel<typeof projectUserTable>;
export type SelectProjectUser = InferSelectModel<typeof projectUserTable>;
