/**
 * API token table. A workspace issues scoped, revocable tokens so external apps
 * and plugins can call Runa's API on its behalf. Only the SHA-256 hash of the
 * token is stored; the plaintext (`runa_...`) is shown once on creation. Scopes
 * are stored here but are only enforced once the auth path accepts these tokens
 * (a later, auth-critical slice); until then tokens are issued but not accepted.
 */

import {
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import { generateDefaultDate, generateDefaultId } from "lib/db/util";

import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

export const apiToken = pgTable(
  "api_token",
  {
    id: generateDefaultId(),
    /** Owning workspace (organization id from JWT claims; not a FK) */
    organizationId: text("organization_id").notNull(),
    /** Human label for the token */
    name: text().notNull(),
    /** SHA-256 hex of the plaintext token; the plaintext is never stored */
    tokenHash: text("token_hash").notNull(),
    /** Granted scopes (e.g. ["task:read"]); an empty array grants nothing */
    scopes: text().array().notNull(),
    /** Identity-provider id of the admin who created it */
    createdBy: text("created_by").notNull(),
    lastUsedAt: timestamp("last_used_at", {
      precision: 6,
      mode: "string",
      withTimezone: true,
    }),
    revokedAt: timestamp("revoked_at", {
      precision: 6,
      mode: "string",
      withTimezone: true,
    }),
    createdAt: generateDefaultDate(),
  },
  (table) => [
    uniqueIndex("api_token_token_hash_idx").on(table.tokenHash),
    index("api_token_organization_id_idx").on(table.organizationId),
  ],
);

export type InsertApiToken = InferInsertModel<typeof apiToken>;
export type SelectApiToken = InferSelectModel<typeof apiToken>;
