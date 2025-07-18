import { index, pgTable, text, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { generateDefaultDate, generateDefaultId } from "lib/db/util";
import { projectTable } from "./project.table";
import { userTable } from "./user.table";

import type { InferInsertModel, InferSelectModel } from "drizzle-orm/table";

export const userPreferenceTable = pgTable(
  "user_preference",
  {
    id: generateDefaultId(),
    userId: uuid()
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),
    projectId: uuid()
      .notNull()
      .references(() => projectTable.id, { onDelete: "cascade" }),
    hiddenColumnIds: text().array().notNull().default([]),
    createdAt: generateDefaultDate(),
    updatedAt: generateDefaultDate(),
  },
  (table) => [uniqueIndex().on(table.id), index().on(table.userId)],
);

export type InsertUserPreference = InferInsertModel<typeof userPreferenceTable>;
export type SelectUserPreference = InferSelectModel<typeof userPreferenceTable>;
