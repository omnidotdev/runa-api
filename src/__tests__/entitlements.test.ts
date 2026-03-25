import { describe, expect, it } from "bun:test";

import { EntitlementsUnavailableError } from "lib/entitlements";

describe("EntitlementsUnavailableError", () => {
  it("sets the correct name", () => {
    const err = new EntitlementsUnavailableError("test");
    expect(err.name).toBe("EntitlementsUnavailableError");
  });

  it("prefixes the message", () => {
    const err = new EntitlementsUnavailableError("billing API down");
    expect(err.message).toBe(
      "Entitlements service unavailable: billing API down",
    );
  });

  it("is an instance of Error", () => {
    const err = new EntitlementsUnavailableError("test");
    expect(err).toBeInstanceOf(Error);
  });
});
