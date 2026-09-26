import { relations } from "drizzle-orm";
import {
  index,
  integer,
  pgTable,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { generateDefaultDate, generateDefaultId } from "lib/db/util";
import { assignees } from "./assignee.table";
import { checklists } from "./checklist.table";
import { columns } from "./column.table";
import { posts } from "./post.table";
import { projects } from "./project.table";
import { users } from "./user.table";

import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import type { AnyPgColumn } from "drizzle-orm/pg-core";

/**
 * Task table.
 */
export const tasks = pgTable(
  "task",
  {
    id: generateDefaultId(),
    // Persistent task number within project (auto-assigned by trigger, immutable)
    number: integer(),
    content: text().notNull(),
    description: text().notNull(),
    priority: varchar({ length: 10 }).notNull().default("medium"),
    authorId: uuid().references(() => users.id, { onDelete: "set null" }),
    projectId: uuid()
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    columnId: uuid()
      .notNull()
      .references(() => columns.id, { onDelete: "cascade" }),
    columnIndex: text().notNull(),
    dueDate: timestamp({
      precision: 6,
      mode: "string",
      withTimezone: true,
    }),
    // Origin task when this task was created by converting a checklist item
    sourceTaskId: uuid().references((): AnyPgColumn => tasks.id, {
      onDelete: "set null",
    }),
    createdAt: generateDefaultDate(),
    updatedAt: generateDefaultDate(),
  },
  (table) => [
    uniqueIndex().on(table.id),
    index().on(table.authorId),
    index().on(table.projectId),
    index().on(table.columnId),
    index().on(table.columnId, table.columnIndex),
    index().on(table.sourceTaskId),
    unique("task_project_number_unique").on(table.projectId, table.number),
  ],
);

export const taskRelations = relations(tasks, ({ one, many }) => ({
  project: one(projects, {
    fields: [tasks.projectId],
    references: [projects.id],
  }),
  sourceTask: one(tasks, {
    fields: [tasks.sourceTaskId],
    references: [tasks.id],
  }),
  posts: many(posts),
  assignees: many(assignees),
  checklists: many(checklists),
}));

export type InsertTask = InferInsertModel<typeof tasks>;
export type SelectTask = InferSelectModel<typeof tasks>;
