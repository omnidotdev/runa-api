import { describe, expect, it } from "bun:test";

import { buildPermissionCacheKey } from "lib/authz";

describe("buildPermissionCacheKey", () => {
  it("joins parts with colons", () => {
    expect(
      buildPermissionCacheKey("user-1", "project", "proj-1", "edit"),
    ).toBe("user-1:project:proj-1:edit");
  });

  it("handles UUIDs", () => {
    const key = buildPermissionCacheKey(
      "550e8400-e29b-41d4-a716-446655440000",
      "workspace",
      "660e8400-e29b-41d4-a716-446655440001",
      "delete",
    );
    expect(key).toBe(
      "550e8400-e29b-41d4-a716-446655440000:workspace:660e8400-e29b-41d4-a716-446655440001:delete",
    );
  });

  it("produces unique keys for different inputs", () => {
    const a = buildPermissionCacheKey("u1", "project", "p1", "read");
    const b = buildPermissionCacheKey("u1", "project", "p1", "write");
    const c = buildPermissionCacheKey("u2", "project", "p1", "read");
    expect(a).not.toBe(b);
    expect(a).not.toBe(c);
  });
});
