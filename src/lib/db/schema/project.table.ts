import {
  index,
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
import { projectColumnTable } from "./project_column.table";

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
    projectColumnId: uuid()
      .notNull()
      .references(() => projectColumnTable.id, { onDelete: "cascade" }),
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
