import {
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import { generateDefaultDate, generateDefaultId } from "lib/db/util";

import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

/**
 * Link unfurl cache. A shared, per-URL cache of preview metadata (title,
 * description, image, and a size-capped favicon data URI) fetched server-side.
 * Not tied to any tenant: the same URL resolves to the same preview everywhere
 */
export const linkUnfurls = pgTable(
  "link_unfurl",
  {
    id: generateDefaultId(),
    url: text().notNull(),
    // sha256 of the normalized URL, unique cache key
    urlHash: text().notNull(),
    // "ok" when metadata was fetched, "error" for a cached negative result
    status: text().notNull(),
    title: text(),
    description: text(),
    imageUrl: text(),
    faviconDataUri: text(),
    fetchedAt: timestamp({
      precision: 6,
      mode: "string",
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
    createdAt: generateDefaultDate(),
    updatedAt: generateDefaultDate(),
  },
  (table) => [
    uniqueIndex().on(table.id),
    uniqueIndex("link_unfurl_url_hash_unique").on(table.urlHash),
    index().on(table.fetchedAt),
  ],
);

export type InsertLinkUnfurl = InferInsertModel<typeof linkUnfurls>;
export type SelectLinkUnfurl = InferSelectModel<typeof linkUnfurls>;
