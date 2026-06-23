import { describe, expect, it } from "bun:test";

import { eventMeta } from "lib/events/enrich";

import type { SelectUser } from "lib/db/schema";

const observer = {
  id: "user-1",
  identityProviderId: "idp-1",
  name: "Ada Lovelace",
  email: "ada@example.com",
} as SelectUser;

describe("eventMeta", () => {
  it("attaches actor fields from the observer", () => {
    const meta = eventMeta(observer, "task", "42");

    expect(meta).toEqual({
      resourceType: "task",
      resourceName: "42",
      actorId: "user-1",
      actorIdpId: "idp-1",
      actorName: "Ada Lovelace",
      actorEmail: "ada@example.com",
    });
  });

  it("omits actor fields for system events (no observer)", () => {
    const meta = eventMeta(null, "project", "Launch");

    expect(meta).toEqual({ resourceType: "project", resourceName: "Launch" });
  });

  it("omits resourceName when absent rather than serializing null", () => {
    expect(eventMeta(null, "post")).toEqual({ resourceType: "post" });
    expect(eventMeta(null, "post", null)).toEqual({ resourceType: "post" });
  });
});
