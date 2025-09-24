import {
  pgEnum,
  pgTable,
  text,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

import { generateDefaultDate, generateDefaultId } from "lib/db/util";

import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

export const tier = pgEnum("tier", ["free", "basic", "team"]);

/**
 * Workspace table.
 */
export const workspaceTable = pgTable(
  "workspace",
  {
    id: generateDefaultId(),
    name: text().notNull(),
    slug: text()
      // TODO
      // .generatedAlwaysAs((): SQL => generateSlug(workspaceTable.name))
      .unique()
      .notNull(),
    viewMode: varchar({ length: 10 }).notNull().default("board"),
    tier: tier().notNull().default("free"),
    createdAt: generateDefaultDate(),
    updatedAt: generateDefaultDate(),
  },
  (table) => [uniqueIndex().on(table.id), uniqueIndex().on(table.slug)],
);

export type InsertWorkspace = InferInsertModel<typeof workspaceTable>;
export type SelectWorkspace = InferSelectModel<typeof workspaceTable>;
