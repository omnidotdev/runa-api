/**
 * Integration tests for the webhook delivery queue against a real Postgres
 * (requires DATABASE_URL). Exercises fan-out on enqueue, success marking,
 * retry/backoff on failure, and dropping deliveries for disabled endpoints.
 */

import { afterAll, beforeEach, describe, expect, test } from "bun:test";

import { dbPool } from "lib/db/db";
import { webhookDelivery, webhookEndpoint } from "lib/db/schema";
import {
  _pollWebhookDeliveryQueueOnce,
  enqueueWebhookDelivery,
} from "lib/webhooks/delivery";

const ORG = "org-webhook-test";

const seedEndpoint = async (
  overrides: Partial<typeof webhookEndpoint.$inferInsert> = {},
) => {
  const [row] = await dbPool
    .insert(webhookEndpoint)
    .values({
      organizationId: ORG,
      url: "https://hooks.example.com/x",
      secret: "s3cr3t",
      createdBy: "idp-admin",
      ...overrides,
    })
    .returning();
  return row;
};

const listDeliveries = () =>
  dbPool
    .select()
    .from(webhookDelivery)
    .then((rows) => rows);

beforeEach(async () => {
  await dbPool.delete(webhookDelivery);
  await dbPool.delete(webhookEndpoint);
});

afterAll(async () => {
  await dbPool.delete(webhookDelivery);
  await dbPool.delete(webhookEndpoint);
});

describe("enqueueWebhookDelivery", () => {
  test("fans an event out to each enabled matching endpoint", async () => {
    await seedEndpoint();
    await seedEndpoint({ url: "https://hooks.example.com/y" });
    await enqueueWebhookDelivery({
      type: "runa.task.updated",
      organizationId: ORG,
      data: { taskId: "t1" },
    });
    const deliveries = await listDeliveries();
    expect(deliveries).toHaveLength(2);
    expect(JSON.parse(deliveries[0]!.payload)).toMatchObject({
      type: "runa.task.updated",
      data: { taskId: "t1" },
    });
  });

  test("respects the endpoint event-type whitelist", async () => {
    await seedEndpoint({ eventTypes: ["runa.task.created"] });
    await enqueueWebhookDelivery({
      type: "runa.task.updated",
      organizationId: ORG,
      data: {},
    });
    expect(await listDeliveries()).toHaveLength(0);
  });

  test("skips a disabled endpoint", async () => {
    await seedEndpoint({ enabled: false });
    await enqueueWebhookDelivery({
      type: "runa.task.updated",
      organizationId: ORG,
      data: {},
    });
    expect(await listDeliveries()).toHaveLength(0);
  });
});

describe("pollWebhookDeliveryQueue", () => {
  test("marks a delivery delivered when the sender succeeds", async () => {
    await seedEndpoint();
    await enqueueWebhookDelivery({
      type: "runa.task.updated",
      organizationId: ORG,
    });

    await _pollWebhookDeliveryQueueOnce(async () => {
      // success
    });

    const [row] = await listDeliveries();
    expect(row!.deliveredAt).not.toBeNull();
    expect(row!.attempts).toBe(0);
  });

  test("retries with backoff when the sender throws", async () => {
    await seedEndpoint();
    await enqueueWebhookDelivery({
      type: "runa.task.updated",
      organizationId: ORG,
    });

    await _pollWebhookDeliveryQueueOnce(async () => {
      throw new Error("endpoint responded 500");
    });

    const [row] = await listDeliveries();
    expect(row!.deliveredAt).toBeNull();
    expect(row!.attempts).toBe(1);
    expect(row!.lastError).toContain("500");
    // backoff pushed next_retry_at into the future, so a second poll is a no-op
    expect(new Date(row!.nextRetryAt).getTime()).toBeGreaterThan(Date.now());
  });

  test("drops a delivery whose endpoint was disabled after enqueue", async () => {
    const ep = await seedEndpoint();
    await enqueueWebhookDelivery({
      type: "runa.task.updated",
      organizationId: ORG,
    });
    await dbPool.delete(webhookEndpoint); // simulate disable/remove
    void ep;

    await _pollWebhookDeliveryQueueOnce(async () => {
      throw new Error("should not be called");
    });

    expect(await listDeliveries()).toHaveLength(0);
  });
});
