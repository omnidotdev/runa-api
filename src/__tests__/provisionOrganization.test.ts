import { beforeEach, describe, expect, it, mock, spyOn } from "bun:test";

/**
 * Records inserts made through the fake db so tests can assert what would be
 * written. `shouldThrow` simulates a transient db failure.
 */
const inserts: Array<{ rows: unknown }> = [];
let shouldThrow = false;

const fakeDb = {
  insert: () => ({
    values: (rows: unknown) => ({
      onConflictDoNothing: () => {
        if (shouldThrow) return Promise.reject(new Error("db unavailable"));
        inserts.push({ rows });
        return Promise.resolve();
      },
    }),
  }),
};

mock.module("lib/db/db", () => ({
  dbPool: fakeDb,
  pgPool: { end: async () => {} },
}));

const { ensureOrganizationProvisioned } = await import(
  "lib/idp/provisionOrganization"
);

describe("ensureOrganizationProvisioned", () => {
  beforeEach(() => {
    inserts.length = 0;
    shouldThrow = false;
  });

  it("provisions the three default project columns and a settings row", async () => {
    await ensureOrganizationProvisioned("org-fresh");

    expect(inserts).toHaveLength(2);

    // First insert: default project columns
    const columns = inserts[0]!.rows as Array<{
      organizationId: string;
      title: string;
      icon: string;
      index: string;
    }>;
    expect(columns).toHaveLength(3);
    expect(columns.map((c) => c.title)).toEqual([
      "Planned",
      "In Progress",
      "Completed",
    ]);
    // every column belongs to the org and has an ordering index
    expect(columns.every((c) => c.organizationId === "org-fresh")).toBe(true);
    expect(columns.every((c) => typeof c.index === "string" && c.index)).toBe(
      true,
    );

    // Second insert: settings row
    expect(inserts[1]!.rows).toEqual({ organizationId: "org-fresh" });
  });

  it("is idempotent: a second call for the same org does not re-insert", async () => {
    await ensureOrganizationProvisioned("org-cached");
    expect(inserts).toHaveLength(2);

    inserts.length = 0;
    await ensureOrganizationProvisioned("org-cached");
    expect(inserts).toHaveLength(0);
  });

  it("never throws and retries after a transient failure", async () => {
    const errorSpy = spyOn(console, "error").mockImplementation(() => {});
    shouldThrow = true;
    // Must not reject even though the db errors
    await ensureOrganizationProvisioned("org-flaky");
    expect(inserts).toHaveLength(0);
    expect(errorSpy).toHaveBeenCalledTimes(1);
    errorSpy.mockRestore();

    // A failed pass is not cached, so a later access retries successfully
    shouldThrow = false;
    await ensureOrganizationProvisioned("org-flaky");
    expect(inserts).toHaveLength(2);
  });
});
