import { describe, expect, test } from "bun:test";

import {
  MAX_WEBHOOK_ATTEMPTS,
  buildWebhookRequest,
  nextRetryDelayMs,
} from "./request";
import { verifyWebhookSignature } from "./signature";

const event = {
  id: "evt_1",
  type: "runa.task.updated",
  source: "omni.runa",
  time: "2026-10-13T00:00:00.000Z",
  data: { taskId: "t1", title: "x" },
};

describe("buildWebhookRequest", () => {
  const req = buildWebhookRequest({
    event,
    target: { url: "https://hooks.example.com/x", secret: "shh" },
    deliveryId: "del_1",
  });

  test("targets the endpoint url with a JSON body carrying the event", () => {
    expect(req.url).toBe("https://hooks.example.com/x");
    expect(req.headers["content-type"]).toBe("application/json");
    const parsed = JSON.parse(req.body);
    expect(parsed).toMatchObject({
      type: "runa.task.updated",
      data: { taskId: "t1" },
    });
  });

  test("sets identifying headers", () => {
    expect(req.headers["x-runa-event"]).toBe("runa.task.updated");
    expect(req.headers["x-runa-delivery"]).toBe("del_1");
  });

  test("signs the exact body that is sent", () => {
    expect(
      verifyWebhookSignature("shh", req.body, req.headers["x-runa-signature"]),
    ).toBe(true);
  });
});

describe("nextRetryDelayMs", () => {
  test("increases with each attempt then caps", () => {
    const d0 = nextRetryDelayMs(0);
    const d1 = nextRetryDelayMs(1);
    const d2 = nextRetryDelayMs(2);
    expect(d0).toBeGreaterThan(0);
    expect(d1).toBeGreaterThan(d0);
    expect(d2).toBeGreaterThan(d1);
    // far-out attempts are capped, not unbounded
    expect(nextRetryDelayMs(100)).toBe(nextRetryDelayMs(50));
    expect(nextRetryDelayMs(100)).toBeLessThanOrEqual(24 * 60 * 60 * 1000);
  });

  test("exposes a bounded attempt ceiling", () => {
    expect(MAX_WEBHOOK_ATTEMPTS).toBeGreaterThanOrEqual(3);
    expect(MAX_WEBHOOK_ATTEMPTS).toBeLessThanOrEqual(12);
  });
});
