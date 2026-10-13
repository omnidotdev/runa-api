/**
 * Integration tests for the webhook endpoint management service against a real
 * Postgres (requires DATABASE_URL): secret generation, URL validation, org
 * scoping, rotate, enable/disable, delete, and list.
 */

import { afterAll, beforeEach, describe, expect, test } from "bun:test";

import { dbPool } from "lib/db/db";
import { webhookEndpoint } from "lib/db/schema";
import {
  createWebhookEndpoint,
  deleteWebhookEndpoint,
  listWebhookEndpoints,
  rotateWebhookEndpointSecret,
  setWebhookEndpointEnabled,
  webhookEndpointOrganizationId,
} from "lib/webhooks/endpoints";

const ORG = "org-a";
const OTHER_ORG = "org-b";

beforeEach(async () => {
  await dbPool.delete(webhookEndpoint);
});

afterAll(async () => {
  await dbPool.delete(webhookEndpoint);
});

describe("createWebhookEndpoint", () => {
  test("generates a secret, stores the endpoint, returns the secret once", async () => {
    const { endpoint, secret } = await createWebhookEndpoint({
      organizationId: ORG,
      url: "https://hooks.example.com/x",
      createdBy: "idp-admin",
    });
    expect(secret).toMatch(/^[0-9a-f]{64}$/);
    expect(endpoint.url).toBe("https://hooks.example.com/x");
    expect(endpoint.enabled).toBe(true);
    // the secret-less info view never carries the secret
    expect(endpoint).not.toHaveProperty("secret");
  });

  test("rejects a URL that fails the SSRF guard", async () => {
    await expect(
      createWebhookEndpoint({
        organizationId: ORG,
        url: "http://169.254.169.254/latest/meta-data",
        createdBy: "idp-admin",
      }),
    ).rejects.toThrow();
    expect(await listWebhookEndpoints(ORG)).toHaveLength(0);
  });
});

describe("org scoping", () => {
  test("rotate/enable/delete only affect the endpoint's own org", async () => {
    const { endpoint } = await createWebhookEndpoint({
      organizationId: ORG,
      url: "https://hooks.example.com/x",
      createdBy: "idp-admin",
    });

    expect(await webhookEndpointOrganizationId(endpoint.id)).toBe(ORG);

    // a different org cannot rotate/disable/delete it
    await expect(
      rotateWebhookEndpointSecret(endpoint.id, OTHER_ORG),
    ).rejects.toThrow();
    await expect(
      setWebhookEndpointEnabled(endpoint.id, OTHER_ORG, false),
    ).rejects.toThrow();
    expect(await deleteWebhookEndpoint(endpoint.id, OTHER_ORG)).toBe(false);

    // the owning org can
    const newSecret = await rotateWebhookEndpointSecret(endpoint.id, ORG);
    expect(newSecret).toMatch(/^[0-9a-f]{64}$/);
    const disabled = await setWebhookEndpointEnabled(endpoint.id, ORG, false);
    expect(disabled.enabled).toBe(false);
    expect(await deleteWebhookEndpoint(endpoint.id, ORG)).toBe(true);
  });
});

describe("rotate changes the stored secret", () => {
  test("the secret actually changes in the DB", async () => {
    const { endpoint } = await createWebhookEndpoint({
      organizationId: ORG,
      url: "https://hooks.example.com/x",
      createdBy: "idp-admin",
    });
    const [before] = await dbPool.select().from(webhookEndpoint);
    const newSecret = await rotateWebhookEndpointSecret(endpoint.id, ORG);
    const [after] = await dbPool.select().from(webhookEndpoint);
    expect(after!.secret).toBe(newSecret);
    expect(after!.secret).not.toBe(before!.secret);
  });
});

describe("listWebhookEndpoints", () => {
  test("returns only the given org's endpoints", async () => {
    await createWebhookEndpoint({
      organizationId: ORG,
      url: "https://a.example.com",
      createdBy: "idp-admin",
    });
    await createWebhookEndpoint({
      organizationId: OTHER_ORG,
      url: "https://b.example.com",
      createdBy: "idp-admin",
    });
    const list = await listWebhookEndpoints(ORG);
    expect(list).toHaveLength(1);
    expect(list[0]!.url).toBe("https://a.example.com");
  });
});
