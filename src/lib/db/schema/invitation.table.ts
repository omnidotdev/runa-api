import { relations } from "drizzle-orm";
import {
  index,
  pgTable,
  text,
  unique,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { generateDefaultDate, generateDefaultId } from "lib/db/util";
import { workspaceTable } from "./workspace.table";

import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

/**
 * Invitation table.
 */
export const invitationsTable = pgTable(
  "invitation",
  {
    id: generateDefaultId(),
    workspaceId: uuid()
      .notNull()
      .references(() => workspaceTable.id, { onDelete: "cascade" }),
    email: text().notNull(),
    createdAt: generateDefaultDate(),
    updatedAt: generateDefaultDate(),
  },
  (table) => [
    uniqueIndex().on(table.id),
    unique().on(table.workspaceId, table.email),
    index().on(table.workspaceId),
  ],
);

export const invitationRelations = relations(invitationsTable, ({ one }) => ({
  workspace: one(workspaceTable, {
    fields: [invitationsTable.workspaceId],
    references: [workspaceTable.id],
  }),
}));

/**
 * Type helpers related to the invitation table.
 */
export type InsertInvitation = InferInsertModel<typeof invitationsTable>;
export type SelectInvitation = InferSelectModel<typeof invitationsTable>;
