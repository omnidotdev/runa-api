import { pgTable, text, uniqueIndex } from "drizzle-orm/pg-core";

import { generateDefaultDate, generateDefaultId } from "lib/db/util";

import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

/**
 * Workspace table.
 */
export const workspaceTable = pgTable(
  "workspace",
  {
    id: generateDefaultId(),
    name: text("name").notNull(),
    createdAt: generateDefaultDate(),
    updatedAt: generateDefaultDate(),
  },
  (table) => [uniqueIndex().on(table.id)],
);

export type InsertWorkspace = InferInsertModel<typeof workspaceTable>;
export type SelectWorkspace = InferSelectModel<typeof workspaceTable>;
