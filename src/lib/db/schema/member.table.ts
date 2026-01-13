import { relations } from "drizzle-orm";
import { index, pgEnum, pgTable, primaryKey, uuid } from "drizzle-orm/pg-core";

import { generateDefaultDate } from "lib/db/util";
import { users } from "./user.table";
import { workspaces } from "./workspace.table";

import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

export const role = pgEnum("role", ["owner", "admin", "member"]);

/**
 * Workspace member junction table.
 *
 * This table manages workspace-level access control, which is distinct from
 * IDP organization membership. A user must be an IDP org member to access
 * any workspace, but workspace membership controls which specific workspaces
 * within that org the user can access.
 *
 * IDP org membership: "Can this user access this organization's apps?"
 * Workspace membership: "Which workspaces within the org can this user see?"
 */
export const members = pgTable(
  "member",
  {
    workspaceId: uuid()
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: role().notNull().default("member"),
    createdAt: generateDefaultDate(),
    updatedAt: generateDefaultDate(),
  },
  (table) => [
    primaryKey({ columns: [table.workspaceId, table.userId] }),
    index().on(table.userId),
    index().on(table.workspaceId),
  ],
);

export const memberRelations = relations(members, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [members.workspaceId],
    references: [workspaces.id],
  }),
}));

export type InsertMember = InferInsertModel<typeof members>;
export type SelectMember = InferSelectModel<typeof members>;
