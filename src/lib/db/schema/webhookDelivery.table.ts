/**
 * Webhook delivery queue. One row per (event, endpoint) to deliver, retried
 * with exponential backoff. HTTP POST is not idempotent, so the poller claims
 * rows with FOR UPDATE SKIP LOCKED (see lib/webhooks/delivery.ts), mirroring the
 * notification digest queue.
 */

import {
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { generateDefaultDate, generateDefaultId } from "lib/db/util";

import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

export const webhookDelivery = pgTable(
  "webhook_delivery",
  {
    id: generateDefaultId(),
    /** Target endpoint (webhook_endpoint.id; resolved at send time) */
    endpointId: uuid("endpoint_id").notNull(),
    /** The CloudEvent being delivered */
    eventId: text("event_id").notNull(),
    eventType: text("event_type").notNull(),
    /** Exact JSON body to POST; signed at send time with the endpoint secret */
    payload: text().notNull(),
    attempts: integer().notNull().default(0),
    maxAttempts: integer("max_attempts").notNull().default(6),
    lastError: text("last_error"),
    /** When the delivery is next eligible to send (now on enqueue) */
    nextRetryAt: generateDefaultDate(),
    /** Set once delivered successfully */
    deliveredAt: timestamp("delivered_at", {
      precision: 6,
      mode: "string",
      withTimezone: true,
    }),
    createdAt: generateDefaultDate(),
  },
  (table) => [
    index("webhook_delivery_next_retry_idx").on(table.nextRetryAt),
    index("webhook_delivery_endpoint_id_idx").on(table.endpointId),
  ],
);

export type InsertWebhookDelivery = InferInsertModel<typeof webhookDelivery>;
export type SelectWebhookDelivery = InferSelectModel<typeof webhookDelivery>;
