/**
 * Integration tests for the API token service against a real Postgres (requires
 * DATABASE_URL): the plaintext is returned once and only its hash is stored,
 * resolve round-trips a live token, revoke and org scoping work, and listing
 * never carries the secret.
 */

import { afterAll, beforeEach, describe, expect, test } from "bun:test";

import { dbPool } from "lib/db/db";
import { apiToken } from "lib/db/schema";
import {
  apiTokenOrganizationId,
  createApiToken,
  listApiTokens,
  resolveApiToken,
  revokeApiToken,
} from "lib/tokens/apiTokens";

const ORG = "org-a";
const OTHER_ORG = "org-b";

beforeEach(async () => {
  await dbPool.delete(apiToken);
});

afterAll(async () => {
  await dbPool.delete(apiToken);
});

describe("createApiToken", () => {
  test("returns a runa_ plaintext once and stores only its hash", async () => {
    const { token, secret } = await createApiToken({
      organizationId: ORG,
      name: "CI",
      scopes: ["task:read"],
      createdBy: "idp-admin",
    });
    expect(secret.startsWith("runa_")).toBe(true);
    expect(token).not.toHaveProperty("secret");
    expect(token).not.toHaveProperty("tokenHash");
    const [stored] = await dbPool.select().from(apiToken);
    // the plaintext is never stored
    expect(stored!.tokenHash).not.toBe(secret);
    expect(stored!.scopes).toEqual(["task:read"]);
  });
});

describe("resolveApiToken", () => {
  test("round-trips a live token to its principal", async () => {
    const { secret } = await createApiToken({
      organizationId: ORG,
      name: "CI",
      scopes: ["task:read", "task:write"],
      createdBy: "idp-admin",
    });
    const resolved = await resolveApiToken(secret);
    expect(resolved).not.toBeNull();
    expect(resolved?.organizationId).toBe(ORG);
    expect(resolved?.scopes).toEqual(["task:read", "task:write"]);
  });

  test("returns null for a non-runa, unknown, or revoked token", async () => {
    expect(await resolveApiToken("not-a-runa-token")).toBeNull();
    expect(await resolveApiToken("runa_deadbeef")).toBeNull();

    const { token, secret } = await createApiToken({
      organizationId: ORG,
      name: "CI",
      scopes: ["task:read"],
      createdBy: "idp-admin",
    });
    await revokeApiToken(token.id, ORG);
    expect(await resolveApiToken(secret)).toBeNull();
  });
});

describe("revoke + org scoping", () => {
  test("another org cannot revoke, the owning org can", async () => {
    const { token } = await createApiToken({
      organizationId: ORG,
      name: "CI",
      scopes: [],
      createdBy: "idp-admin",
    });
    expect(await apiTokenOrganizationId(token.id)).toBe(ORG);
    expect(await revokeApiToken(token.id, OTHER_ORG)).toBe(false);
    expect(await revokeApiToken(token.id, ORG)).toBe(true);
    // revoking an already-revoked token reports no change
    expect(await revokeApiToken(token.id, ORG)).toBe(false);
  });
});

describe("listApiTokens", () => {
  test("returns only the given org's tokens, without secrets", async () => {
    await createApiToken({
      organizationId: ORG,
      name: "A",
      scopes: [],
      createdBy: "idp-admin",
    });
    await createApiToken({
      organizationId: OTHER_ORG,
      name: "B",
      scopes: [],
      createdBy: "idp-admin",
    });
    const list = await listApiTokens(ORG);
    expect(list).toHaveLength(1);
    expect(list[0]!.name).toBe("A");
    expect(list[0]).not.toHaveProperty("tokenHash");
  });
});
