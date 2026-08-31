import { afterEach, beforeEach, expect, it, mock } from "bun:test";
import { createHmac } from "node:crypto";

import { eq } from "drizzle-orm";

// The handler fails closed when BILLING_WEBHOOK_SECRET is unset (see
// webhooksSecretUnset.test.ts for that path); this file covers a configured
// secret being rejected because the signature itself doesn't verify.
const TEST_SECRET = "billing-test-signing-secret";

const actualEnvConfig = await import("lib/config/env.config");
mock.module("lib/config/env.config", () => ({
  ...actualEnvConfig,
  BILLING_WEBHOOK_SECRET: TEST_SECRET,
}));

const { dbPool } = await import("lib/db/db");
const { settings } = await import("lib/db/schema");
const { default: entitlementsWebhook } = await import("./webhooks");

const ORG = "entitlements-test-invalid-sig-org";

const sign = (body: string) =>
  createHmac("sha256", TEST_SECRET).update(body).digest("hex");

const rawBody = JSON.stringify({
  eventType: "entitlement.updated",
  entityType: "organization",
  entityId: ORG,
  appId: "runa",
  version: 1,
  timestamp: "2026-08-18T00:00:00.000Z",
  billingAccountId: "acct_forged",
});

const post = (signature?: string) =>
  entitlementsWebhook.handle(
    new Request("http://localhost/webhooks/entitlements", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-billing-signature": signature ?? sign(rawBody),
      },
      body: rawBody,
    }),
  );

beforeEach(async () => {
  await dbPool.delete(settings).where(eq(settings.organizationId, ORG));
  await dbPool
    .insert(settings)
    .values({ organizationId: ORG, billingAccountId: null });
});

afterEach(() =>
  dbPool.delete(settings).where(eq(settings.organizationId, ORG)),
);

it("rejects a forged signature with 401 and does not sync billingAccountId", async () => {
  const res = await post("0".repeat(64));
  expect(res.status).toBe(401);

  const row = await dbPool.query.settings.findFirst({
    where: eq(settings.organizationId, ORG),
  });
  expect(row?.billingAccountId).toBeNull();
});

it("accepts a validly-signed webhook and syncs billingAccountId", async () => {
  const res = await post();

  expect(res.status).toBe(200);

  const row = await dbPool.query.settings.findFirst({
    where: eq(settings.organizationId, ORG),
  });
  expect(row?.billingAccountId).toBe("acct_forged");
});
