/**
 * Integration test for the event -> webhook fan-out tap (requires DATABASE_URL).
 * `events.emit` is wrapped in lib/providers so every emitted domain event also
 * enqueues a webhook delivery per matching endpoint. This is the glue that makes
 * the whole webhook feature fire; if it silently regresses, webhooks stop with
 * no error, so it is tested end to end here (enqueue + poll are covered
 * separately in delivery.integration.test).
 */

import { afterAll, beforeEach, describe, expect, test } from "bun:test";

import { dbPool } from "lib/db/db";
import { webhookDelivery, webhookEndpoint } from "lib/db/schema";
import { events } from "lib/providers";

const ORG = "org-tap-test";

type EmitEvent = Parameters<typeof events.emit>[0];

beforeEach(async () => {
  await dbPool.delete(webhookDelivery);
  await dbPool.delete(webhookEndpoint);
});

afterAll(async () => {
  await dbPool.delete(webhookDelivery);
  await dbPool.delete(webhookEndpoint);
});

describe("events.emit webhook fan-out tap", () => {
  test("emitting a domain event enqueues a delivery for a matching endpoint", async () => {
    await dbPool.insert(webhookEndpoint).values({
      organizationId: ORG,
      url: "https://hooks.example.com/x",
      secret: "s",
      createdBy: "idp",
    });

    await events.emit({
      type: "runa.task.updated",
      organizationId: ORG,
      subject: "t1",
      data: { taskId: "t1" },
    } as EmitEvent);

    const deliveries = await dbPool.select().from(webhookDelivery);
    expect(deliveries).toHaveLength(1);
    expect(deliveries[0]!.eventType).toBe("runa.task.updated");
    expect(JSON.parse(deliveries[0]!.payload)).toMatchObject({
      type: "runa.task.updated",
      data: { taskId: "t1" },
    });
  });

  test("with no endpoints, emit still resolves and enqueues nothing", async () => {
    await expect(
      events.emit({
        type: "runa.task.created",
        organizationId: ORG,
        data: {},
      } as EmitEvent),
    ).resolves.toBeDefined();
    expect(await dbPool.select().from(webhookDelivery)).toHaveLength(0);
  });
});
