import { index, pgTable, primaryKey, uuid } from "drizzle-orm/pg-core";
import { userTable } from "./user.table";
import { workspaceTable } from "./workspace.table";

import { generateDefaultDate } from "lib/db/util";

import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

/**
 * Workspace users junction table.
 */
export const workspaceUserTable = pgTable(
  "workspace_user",
  {
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaceTable.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),
    createdAt: generateDefaultDate(),
  },
  (table) => [
    primaryKey({ columns: [table.workspaceId, table.userId] }),
    index().on(table.userId),
    index().on(table.workspaceId),
  ],
);

export type InsertWorkspaceUser = InferInsertModel<typeof workspaceUserTable>;
export type SelectWorkspaceUser = InferSelectModel<typeof workspaceUserTable>;
