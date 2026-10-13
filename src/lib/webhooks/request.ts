/**
 * Pure builders for an outbound webhook delivery: the signed HTTP request a
 * worker sends, and the retry backoff schedule. Kept side-effect-free so the
 * payload shape, signature, and retry policy are unit-testable; the Graphile
 * Worker job wires these to real fetch + the delivery log.
 */

import { signWebhookBody } from "./signature";

/** Max delivery attempts before a delivery is marked permanently failed. */
export const MAX_WEBHOOK_ATTEMPTS = 6;

const RETRY_BASE_MS = 10_000; // 10s
const RETRY_CAP_MS = 24 * 60 * 60 * 1000; // 1 day

/** The CloudEvent-shaped payload runa emits, as delivered to a webhook. */
export interface WebhookEvent {
  id: string;
  type: string;
  source: string;
  time: string;
  data: unknown;
}

/** A registered endpoint's delivery target. */
interface WebhookTarget {
  url: string;
  secret: string;
}

/** A ready-to-send HTTP request (the worker passes this to fetch). */
interface WebhookRequest {
  url: string;
  headers: Record<string, string>;
  body: string;
}

/**
 * Build the signed request for one delivery. The body is serialized once and
 * signed, so the `x-runa-signature` header always matches the exact bytes sent.
 */
export const buildWebhookRequest = ({
  event,
  target,
  deliveryId,
}: {
  event: WebhookEvent;
  target: WebhookTarget;
  deliveryId: string;
}): WebhookRequest => {
  const body = JSON.stringify(event);
  return {
    url: target.url,
    headers: {
      "content-type": "application/json",
      "user-agent": "Runa-Webhooks/1",
      "x-runa-event": event.type,
      "x-runa-delivery": deliveryId,
      "x-runa-signature": signWebhookBody(target.secret, body),
    },
    body,
  };
};

/**
 * Exponential backoff for retry `attempt` (0-based), capped at one day, so a
 * flaky or down endpoint is retried with widening gaps rather than hammered.
 */
export const nextRetryDelayMs = (attempt: number): number =>
  Math.min(RETRY_BASE_MS * 2 ** attempt, RETRY_CAP_MS);
