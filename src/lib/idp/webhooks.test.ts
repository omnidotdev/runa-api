import { afterEach, beforeEach, expect, it, mock } from "bun:test";
import { createHmac } from "node:crypto";

import { eq, inArray } from "drizzle-orm";

// The handler now fails closed when IDP_WEBHOOK_SECRET is unset (see
// webhooksSecretUnset.test.ts for that path), so these functional tests need
// a configured secret and a validly-signed request.
const TEST_SECRET = "idp-test-signing-secret";

const actualEnvConfig = await import("lib/config/env.config");
mock.module("lib/config/env.config", () => ({
  ...actualEnvConfig,
  IDP_WEBHOOK_SECRET: TEST_SECRET,
}));

const { dbPool } = await import("lib/db/db");
const { settings } = await import("lib/db/schema");
const { default: idpWebhook } = await import("./webhooks");

// Scoping test for the organization.deleted handler: it soft-deletes the deleted
// org's settings row and must never touch another org's.
const TARGET = "idp-test-org-deleted-target";
const CONTROL = "idp-test-org-deleted-control";

const sign = (body: string) =>
  createHmac("sha256", TEST_SECRET).update(body).digest("hex");

const post = (organizationId: string, signature?: string) => {
  const rawBody = JSON.stringify({
    eventType: "organization.deleted",
    organizationId,
    deletedAt: "2026-08-18T00:00:00.000Z",
    timestamp: "2026-08-18T00:00:00.000Z",
  });

  return idpWebhook.handle(
    new Request("http://localhost/webhooks/idp", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-idp-signature": signature ?? sign(rawBody),
      },
      body: rawBody,
    }),
  );
};

const cleanup = () =>
  dbPool
    .delete(settings)
    .where(inArray(settings.organizationId, [TARGET, CONTROL]));

beforeEach(async () => {
  await cleanup();
  await dbPool
    .insert(settings)
    .values([{ organizationId: TARGET }, { organizationId: CONTROL }]);
});

afterEach(cleanup);

const read = (organizationId: string) =>
  dbPool.query.settings.findFirst({
    where: eq(settings.organizationId, organizationId),
  });

it("soft-deletes the target org's settings and leaves other orgs untouched", async () => {
  const res = await post(TARGET);
  expect(res.status).toBe(200);

  const target = await read(TARGET);
  const control = await read(CONTROL);

  expect(target?.deletedAt).not.toBeNull();
  // The other org's settings must be unaffected
  expect(control?.deletedAt).toBeNull();
});

it("no-ops (200) for an org with no local settings", async () => {
  const res = await post("idp-test-org-deleted-absent");
  expect(res.status).toBe(200);
});

it("rejects a forged signature with 401 and does not mutate settings", async () => {
  const res = await post(TARGET, "0".repeat(64));
  expect(res.status).toBe(401);

  const target = await read(TARGET);
  expect(target?.deletedAt).toBeNull();
});
