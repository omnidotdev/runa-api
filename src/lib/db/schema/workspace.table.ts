import { relations } from "drizzle-orm";
import {
  index,
  pgEnum,
  pgTable,
  text,
  unique,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

import { generateDefaultDate, generateDefaultId } from "lib/db/util";
import { invitations } from "./invitation.table";
import { members } from "./member.table";
import { projects } from "./project.table";
import { projectColumns } from "./projectColumn.table";

import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

export const tier = pgEnum("tier", ["free", "basic", "team", "enterprise"]);

/**
 * Workspace table.
 */
export const workspaces = pgTable(
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
    subscriptionId: text(),
    billingAccountId: text(),
    createdAt: generateDefaultDate(),
    updatedAt: generateDefaultDate(),
  },
  (table) => [
    uniqueIndex().on(table.id),
    unique().on(table.slug),
    index("workspace_organization_id_idx").on(table.organizationId),
  ],
);

export const workspaceRelations = relations(workspaces, ({ many }) => ({
  members: many(members),
  projects: many(projects),
  projectColumns: many(projectColumns),
  invitations: many(invitations),
}));

export type InsertWorkspace = InferInsertModel<typeof workspaces>;
export type SelectWorkspace = InferSelectModel<typeof workspaces>;
