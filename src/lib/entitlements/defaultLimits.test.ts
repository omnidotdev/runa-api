/**
 * Free-tier fallback limit tests.
 *
 * With no billing provider configured, entitlements resolve to null and every
 * check falls back to DEFAULT_LIMITS, which must mirror the product catalog
 * SSOT (omni-api planConfigs, runa free tier)
 */

import { describe, expect, it, mock } from "bun:test";

const realProviders = await import("lib/providers");
mock.module("lib/providers", () => ({ ...realProviders, billing: null }));

const { isWithinLimit } = await import("./index");

const entity = { organizationId: "org-unprovisioned" };

describe("free-tier fallback limits mirror the catalog", () => {
  it("never caps members or admins (catalog max_members, max_admins: -1)", async () => {
    expect(await isWithinLimit(entity, "max_members", 100_000)).toBe(true);
    expect(await isWithinLimit(entity, "max_admins", 100_000)).toBe(true);
  });
});
