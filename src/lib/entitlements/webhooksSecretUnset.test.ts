import { afterEach, beforeEach, expect, it, mock } from "bun:test";

import { eq } from "drizzle-orm";

// Verifies the fail-closed path: with BILLING_WEBHOOK_SECRET unset, the
// receiver cannot authenticate the caller and must reject before touching
// the db, regardless of what other test files configure the secret to.
const actualEnvConfig = await import("lib/config/env.config");
mock.module("lib/config/env.config", () => ({
  ...actualEnvConfig,
  BILLING_WEBHOOK_SECRET: undefined,
}));

const { dbPool } = await import("lib/db/db");
const { settings } = await import("lib/db/schema");
// @ts-expect-error - query string busts bun's module cache to force a fresh
// import bound to the mocked env config above; tsc has no module for it
const { default: webhook } = await import("./webhooks?case=secret-unset");

const ORG = "entitlements-test-secret-unset-org";

const post = () =>
  webhook.handle(
    new Request("http://localhost/webhooks/entitlements", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        eventType: "entitlement.updated",
        entityType: "organization",
        entityId: ORG,
        appId: "runa",
        version: 1,
        timestamp: "2026-08-18T00:00:00.000Z",
        billingAccountId: "acct_forged",
      }),
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

it("rejects an unsigned webhook with 503 and does not sync billingAccountId", async () => {
  const res = await post();
  expect(res.status).toBe(503);

  const row = await dbPool.query.settings.findFirst({
    where: eq(settings.organizationId, ORG),
  });
  expect(row?.billingAccountId).toBeNull();
});
