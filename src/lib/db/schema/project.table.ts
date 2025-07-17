import {
  index,
  pgEnum,
  pgTable,
  text,
  unique,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { workspaceTable } from "./workspace.table";

import { generateDefaultDate, generateDefaultId } from "lib/db/util";

import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

export const status = pgEnum("project_status", [
  "planned",
  "in_progress",
  "completed",
]);

/**
 * Project table.
 */
export const projectTable = pgTable(
  "project",
  {
    id: generateDefaultId(),
    name: text().notNull(),
    description: text(),
    prefix: varchar({ length: 10 }),
    color: varchar({ length: 20 }),
    slug: text()
      // TODO
      // .generatedAlwaysAs((): SQL => generateSlug(projectTable.name))
      .notNull(),
    workspaceId: uuid()
      .notNull()
      .references(() => workspaceTable.id, { onDelete: "cascade" }),
    status: status().notNull().default("planned"),
    viewMode: varchar({ length: 10 }).notNull().default("board"),
    createdAt: generateDefaultDate(),
    updatedAt: generateDefaultDate(),
  },
  (table) => [
    uniqueIndex().on(table.id),
    index().on(table.workspaceId),
    unique().on(table.slug, table.workspaceId),
  ],
);

export type InsertProject = InferInsertModel<typeof projectTable>;
export type SelectProject = InferSelectModel<typeof projectTable>;
