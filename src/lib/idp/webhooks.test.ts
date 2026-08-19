import { afterEach, beforeEach, expect, it } from "bun:test";

import { eq, inArray } from "drizzle-orm";

import { dbPool } from "lib/db/db";
import { settings } from "lib/db/schema";
import idpWebhook from "./webhooks";

// Scoping test for the organization.deleted handler: it soft-deletes the deleted
// org's settings row and must never touch another org's. IDP_WEBHOOK_SECRET is
// unset in tests, so the receiver accepts the unsigned post.
const TARGET = "idp-test-org-deleted-target";
const CONTROL = "idp-test-org-deleted-control";

const post = (organizationId: string) =>
  idpWebhook.handle(
    new Request("http://localhost/webhooks/idp", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        eventType: "organization.deleted",
        organizationId,
        deletedAt: "2026-08-18T00:00:00.000Z",
        timestamp: "2026-08-18T00:00:00.000Z",
      }),
    }),
  );

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
