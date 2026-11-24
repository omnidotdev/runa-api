import { relations, sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  unique,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { generateDefaultDate, generateDefaultId } from "lib/db/util";
import { columns } from "./column.table";
import { labels } from "./label.table";
import { projectColumns } from "./projectColumn.table";
import { projectLinks } from "./projectLink.table";
import { tasks } from "./task.table";

import type { InferInsertModel, InferSelectModel, SQL } from "drizzle-orm";

/**
 * Board background. Distinct from `color` (which drives accents: avatars,
 * labels, drag state). `null` renders the neutral default surface.
 *
 * - `solid` / `gradient`: curated preset referenced by a client-resolved token
 * - `image`: uploaded or gallery image served via the media route
 */
export type ProjectBackground =
  | { kind: "solid"; token: string }
  | { kind: "gradient"; token: string }
  | {
      kind: "image";
      assetId: string;
      position?: string;
      blur?: number;
      chromeContrast?: "light" | "dark";
      /** Blur-up placeholder (tiny webp data URI) shown until the image loads */
      lqip?: string;
    };

/**
 * Constrain a client-supplied blur-up placeholder to null or a small inline
 * base64 image data URI, so a patch cannot store arbitrary strings that the
 * app paints as a CSS background. The `;` after the media type is written as
 * the regex escape `\u003b` because drizzle-kit cuts a check's SQL at a
 * literal semicolon
 * @param value - SQL expression holding the placeholder text
 */
const lqipCheck = (value: SQL) =>
  sql`${value} is null or (length(${value}) <= 4096 and ${value} ~ '^data:image/(webp|png|jpeg)\\u003bbase64,[A-Za-z0-9+/=]+$')`;

/**
 * Project table.
 *
 * Projects belong directly to organizations (via organizationId from JWT claims).
 * No FK to settings table - settings are separate app preferences.
 */
export const projects = pgTable(
  "project",
  {
    id: generateDefaultId(),
    name: text().notNull(),
    description: text(),
    prefix: varchar({ length: 10 }),
    slug: text()
      // TODO
      // .generatedAlwaysAs((): SQL => generateSlug(projects.name))
      .notNull(),
    // Organization ID from JWT claims - not a FK, just a reference
    organizationId: text().notNull(),
    projectColumnId: uuid()
      .notNull()
      .references(() => projectColumns.id, { onDelete: "cascade" }),
    columnIndex: text().notNull(),
    // whether the project is publicly accessible (like Trello public boards)
    isPublic: boolean().notNull().default(false),
    // Counter for auto-incrementing task numbers within this project
    nextTaskNumber: integer("next_task_number").notNull().default(1),
    color: varchar({ length: 24 }),
    // Board background preset or image; null renders the neutral default surface
    background: jsonb().$type<ProjectBackground>(),
    // Avatar image URL (served via the media serve route)
    image: text(),
    // Blur-up placeholder for `image` (tiny webp data URI), null when unknown
    imageLqip: text(),
    createdAt: generateDefaultDate(),
    updatedAt: generateDefaultDate(),
  },
  (table) => [
    uniqueIndex().on(table.id),
    index("project_organization_id_idx").on(table.organizationId),
    index().on(table.projectColumnId),
    index().on(table.projectColumnId, table.columnIndex),
    unique().on(table.slug, table.organizationId),
    check("project_image_lqip_format", lqipCheck(sql`${table.imageLqip}`)),
    check(
      "project_background_lqip_format",
      lqipCheck(sql`(${table.background} ->> 'lqip')`),
    ),
  ],
);

export const projectRelations = relations(projects, ({ one, many }) => ({
  projectColumn: one(projectColumns, {
    fields: [projects.projectColumnId],
    references: [projectColumns.id],
  }),
  tasks: many(tasks),
  labels: many(labels),
  columns: many(columns),
  projectLinks: many(projectLinks),
}));

export type InsertProject = InferInsertModel<typeof projects>;
export type SelectProject = InferSelectModel<typeof projects>;
