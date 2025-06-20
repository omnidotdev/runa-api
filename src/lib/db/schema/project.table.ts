import {
  index,
  jsonb,
  pgTable,
  text,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { workspaceTable } from "./workspace.table";

import { generateDefaultDate, generateDefaultId } from "lib/db/util";

import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

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
    labels: jsonb("labels").$type<string[]>(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaceTable.id),
    viewMode: varchar({ length: 10 }).notNull().default("board"),
    createdAt: generateDefaultDate(),
    updatedAt: generateDefaultDate(),
  },
  (table) => [uniqueIndex().on(table.id), index().on(table.workspaceId)],
);

export type InsertProject = InferInsertModel<typeof projectTable>;
export type SelectProject = InferSelectModel<typeof projectTable>;
