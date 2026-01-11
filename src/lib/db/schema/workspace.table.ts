import { relations } from "drizzle-orm";
import {
  index,
  pgEnum,
  pgTable,
  text,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

import { generateDefaultDate, generateDefaultId } from "lib/db/util";
import { invitationsTable } from "./invitation.table";
import { projectTable } from "./project.table";
import { projectColumnTable } from "./projectColumn.table";
import { workspaceUserTable } from "./workspaceUser.table";

import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

export const tier = pgEnum("tier", ["free", "basic", "team"]);

/**
 * Workspace table.
 */
export const workspaceTable = pgTable(
  "workspace",
  {
    id: generateDefaultId(),
    // FK to IDP organization - workspaces belong to orgs
    organizationId: text("organization_id").notNull(),
    name: text().notNull(),
    slug: text()
      // TODO
      // .generatedAlwaysAs((): SQL => generateSlug(workspaceTable.name))
      .notNull(),
    viewMode: varchar({ length: 10 }).notNull().default("board"),
    tier: tier().notNull().default("free"),
    billingAccountId: text(),
    createdAt: generateDefaultDate(),
    updatedAt: generateDefaultDate(),
  },
  (table) => [
    uniqueIndex().on(table.id),
    uniqueIndex("workspace_slug_idx").on(table.slug),
    index("workspace_organization_id_idx").on(table.organizationId),
  ],
);

export const workspaceRelations = relations(workspaceTable, ({ many }) => ({
  workspaceUsers: many(workspaceUserTable),
  projects: many(projectTable),
  projectColumns: many(projectColumnTable),
  invitations: many(invitationsTable),
}));

export type InsertWorkspace = InferInsertModel<typeof workspaceTable>;
export type SelectWorkspace = InferSelectModel<typeof workspaceTable>;
