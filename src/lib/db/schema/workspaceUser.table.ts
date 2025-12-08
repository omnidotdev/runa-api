import { relations } from "drizzle-orm";
import { index, pgEnum, pgTable, primaryKey, uuid } from "drizzle-orm/pg-core";

import { generateDefaultDate } from "lib/db/util";
import { userTable } from "./user.table";
import { workspaceTable } from "./workspace.table";

import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

export const role = pgEnum("role", ["owner", "admin", "member"]);

/**
 * Workspace user junction table.
 */
export const workspaceUserTable = pgTable(
  "workspace_user",
  {
    workspaceId: uuid()
      .notNull()
      .references(() => workspaceTable.id, { onDelete: "cascade" }),
    userId: uuid()
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),
    role: role().notNull().default("member"),
    createdAt: generateDefaultDate(),
  },
  (table) => [
    primaryKey({ columns: [table.workspaceId, table.userId] }),
    index().on(table.userId),
    index().on(table.workspaceId),
  ],
);

export const workspaceUserRelations = relations(
  workspaceUserTable,
  ({ one }) => ({
    workspace: one(workspaceTable, {
      fields: [workspaceUserTable.workspaceId],
      references: [workspaceTable.id],
    }),
  }),
);

export type InsertWorkspaceUser = InferInsertModel<typeof workspaceUserTable>;
export type SelectWorkspaceUser = InferSelectModel<typeof workspaceUserTable>;
