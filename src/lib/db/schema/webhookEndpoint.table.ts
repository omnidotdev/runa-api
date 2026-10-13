/**
 * Webhook endpoint table. A workspace registers destination URLs that receive
 * Runa's domain events (the outbound half of the plugin system), signed with a
 * per-endpoint secret. The URL is validated against the SSRF guard on write.
 */

import { boolean, index, pgTable, text } from "drizzle-orm/pg-core";

import { generateDefaultDate, generateDefaultId } from "lib/db/util";

import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

export const webhookEndpoint = pgTable(
  "webhook_endpoint",
  {
    id: generateDefaultId(),
    /** Owning workspace (organization id from JWT claims; not a FK) */
    organizationId: text("organization_id").notNull(),
    /** Destination URL, re-validated against the SSRF guard on every write */
    url: text().notNull(),
    /** Per-endpoint HMAC signing secret */
    secret: text().notNull(),
    /** Event-type whitelist (e.g. ["runa.task.updated"]); null/empty = all events */
    eventTypes: text("event_types").array(),
    enabled: boolean().notNull().default(true),
    /** Identity-provider id of the admin who created the endpoint */
    createdBy: text("created_by").notNull(),
    createdAt: generateDefaultDate(),
    updatedAt: generateDefaultDate(),
  },
  (table) => [
    index("webhook_endpoint_organization_id_idx").on(table.organizationId),
  ],
);

export type InsertWebhookEndpoint = InferInsertModel<typeof webhookEndpoint>;
export type SelectWebhookEndpoint = InferSelectModel<typeof webhookEndpoint>;
