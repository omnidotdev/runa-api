/**
 * Outbound webhook delivery queue.
 *
 * On a domain event, `enqueueWebhookDelivery` fans the event out to every
 * enabled endpoint of the owning workspace (one `webhook_delivery` row each).
 * The poller claims due rows with FOR UPDATE SKIP LOCKED so multiple API
 * replicas never double-POST (an HTTP delivery is not idempotent, like the
 * notification digest and unlike the warden sync queue), signs each with the
 * endpoint secret, and retries with exponential backoff up to the row's cap.
 *
 * SSRF: the destination is attacker-chosen, so every send re-validates the URL
 * AND re-resolves its host, rejecting any resolved private/loopback/metadata
 * address (defeats DNS rebinding) before connecting.
 */

import { randomUUID } from "node:crypto";
import { lookup } from "node:dns/promises";

import { and, eq } from "drizzle-orm";

import { dbPool, pgPool } from "lib/db/db";
import { webhookDelivery, webhookEndpoint } from "lib/db/schema";
import { buildWebhookRequest, nextRetryDelayMs } from "lib/webhooks/request";
import {
  assertAllowedWebhookUrl,
  blockedWebhookHostReason,
} from "lib/webhooks/ssrfGuard";

import type { WebhookEvent } from "lib/webhooks/request";

const POLL_INTERVAL_MS = 30_000;
const POLL_BATCH_SIZE = 100;
const SEND_TIMEOUT_MS = 10_000;

let pollTimer: ReturnType<typeof setInterval> | null = null;

/** The shape emitted by the events provider that we fan out to webhooks. */
export interface EmittableEvent {
  type: string;
  organizationId?: string | null;
  subject?: string | null;
  data?: unknown;
}

/** A claimed delivery row + its resolved endpoint, passed to a sender. */
interface PendingDelivery {
  id: string;
  eventType: string;
  payload: string;
  url: string;
  secret: string;
}

/** Sends one delivery; throws on block or non-2xx so the poller retries. Injectable for tests. */
type WebhookSender = (delivery: PendingDelivery) => Promise<void>;

/** Fan a just-emitted event out to the workspace's enabled endpoints. Never throws into the emit path. */
export const enqueueWebhookDelivery = async (
  event: EmittableEvent,
): Promise<void> => {
  try {
    if (!event.organizationId) return;
    const endpoints = await dbPool
      .select()
      .from(webhookEndpoint)
      .where(
        and(
          eq(webhookEndpoint.organizationId, event.organizationId),
          eq(webhookEndpoint.enabled, true),
        ),
      );
    if (endpoints.length === 0) return;

    const webhookEvent: WebhookEvent = {
      id: randomUUID(),
      type: event.type,
      source: "omni.runa",
      time: new Date().toISOString(),
      data: event.data ?? null,
    };
    const payload = JSON.stringify(webhookEvent);

    const rows = endpoints
      .filter(
        (ep) =>
          !ep.eventTypes ||
          ep.eventTypes.length === 0 ||
          ep.eventTypes.includes(event.type),
      )
      .map((ep) => ({
        endpointId: ep.id,
        eventId: webhookEvent.id,
        eventType: event.type,
        payload,
      }));
    if (rows.length > 0) await dbPool.insert(webhookDelivery).values(rows);
  } catch (error) {
    console.error("[Webhooks] Failed to enqueue delivery:", error);
  }
};

/** Re-validate + re-resolve a URL, rejecting any private/loopback/metadata target. */
const assertResolvedPublic = async (url: string): Promise<void> => {
  assertAllowedWebhookUrl(url);
  const { hostname } = new URL(url);
  const addresses = await lookup(hostname, { all: true });
  for (const { address } of addresses) {
    const reason = blockedWebhookHostReason(address);
    if (reason) {
      throw new Error(`webhook host resolves to a blocked address: ${reason}`);
    }
  }
};

/** Default sender: SSRF-check, sign, POST, throw unless 2xx. */
const sendWebhook: WebhookSender = async (delivery) => {
  await assertResolvedPublic(delivery.url);
  const event = JSON.parse(delivery.payload) as WebhookEvent;
  const req = buildWebhookRequest({
    event,
    target: { url: delivery.url, secret: delivery.secret },
    deliveryId: delivery.id,
  });
  const res = await fetch(req.url, {
    method: "POST",
    headers: req.headers,
    body: req.body,
    signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`endpoint responded ${res.status}`);
};

/** Claim due deliveries and send them. `send` is injectable for tests. */
const pollWebhookDeliveryQueue = async (
  send: WebhookSender = sendWebhook,
): Promise<void> => {
  const client = await pgPool.connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query(
      `SELECT d.id, d.event_type, d.payload, d.attempts, d.max_attempts,
              e.url, e.secret, e.enabled
         FROM webhook_delivery d
         LEFT JOIN webhook_endpoint e ON e.id = d.endpoint_id
        WHERE d.delivered_at IS NULL AND d.next_retry_at <= now()
        ORDER BY d.next_retry_at
          FOR UPDATE OF d SKIP LOCKED
        LIMIT $1`,
      [POLL_BATCH_SIZE],
    );

    for (const row of rows) {
      if (row.enabled !== true) {
        // endpoint was deleted or disabled since enqueue; drop the delivery
        await client.query("DELETE FROM webhook_delivery WHERE id = $1", [
          row.id,
        ]);
        continue;
      }
      try {
        await send({
          id: row.id as string,
          eventType: row.event_type as string,
          payload: row.payload as string,
          url: row.url as string,
          secret: row.secret as string,
        });
        await client.query(
          "UPDATE webhook_delivery SET delivered_at = now(), last_error = NULL WHERE id = $1",
          [row.id],
        );
      } catch (error) {
        const attempts = Number(row.attempts) + 1;
        const message =
          error instanceof Error ? error.message : "delivery failed";
        if (attempts >= Number(row.max_attempts)) {
          // dead-letter: stop retrying by pushing eligibility far out
          await client.query(
            `UPDATE webhook_delivery
                SET attempts = $1, last_error = $2,
                    next_retry_at = now() + interval '100 years'
              WHERE id = $3`,
            [attempts, message, row.id],
          );
        } else {
          await client.query(
            `UPDATE webhook_delivery
                SET attempts = $1, last_error = $2,
                    next_retry_at = now() + ($3 || ' milliseconds')::interval
              WHERE id = $4`,
            [attempts, message, String(nextRetryDelayMs(attempts)), row.id],
          );
        }
      }
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("[Webhooks] Poll error:", error);
  } finally {
    client.release();
  }
};

/** Start the delivery poller (idempotent). */
export const startWebhookDeliveryPoller = (): void => {
  if (pollTimer) return;
  pollTimer = setInterval(pollWebhookDeliveryQueue, POLL_INTERVAL_MS).unref();
  pollWebhookDeliveryQueue();
  console.info(
    `[Webhooks] Delivery poller started (interval: ${POLL_INTERVAL_MS}ms)`,
  );
};

/** Exposed for tests: run one poll cycle synchronously with an injectable sender. */
export const _pollWebhookDeliveryQueueOnce = pollWebhookDeliveryQueue;
