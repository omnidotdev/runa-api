import { describe, expect, it } from "bun:test";

import { nextRetryTimestamp } from "lib/authz/syncQueue";

describe("nextRetryTimestamp", () => {
  it("grows exponentially from a 5s base", () => {
    const now = Date.now();
    const delta = nextRetryTimestamp(1).getTime() - now;
    expect(delta).toBeGreaterThanOrEqual(9_000);
    expect(delta).toBeLessThanOrEqual(11_000);
  });

  it("caps at 25 minutes", () => {
    const now = Date.now();
    const delta = nextRetryTimestamp(20).getTime() - now;
    expect(delta).toBeLessThanOrEqual(25 * 60 * 1_000 + 1_000);
  });
});
