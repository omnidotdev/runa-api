import { describe, expect, test } from "bun:test";

import { signWebhookBody, verifyWebhookSignature } from "./signature";

describe("webhook signatures", () => {
  test("produces a 64-char hex sha256 HMAC", () => {
    const sig = signWebhookBody("secret", "body");
    expect(sig).toMatch(/^[0-9a-f]{64}$/);
  });

  test("round-trips: a body signed with a secret verifies with that secret", () => {
    const sig = signWebhookBody("s3cr3t", '{"a":1}');
    expect(verifyWebhookSignature("s3cr3t", '{"a":1}', sig)).toBe(true);
  });

  test("rejects a wrong secret or a tampered body", () => {
    const sig = signWebhookBody("s3cr3t", '{"a":1}');
    expect(verifyWebhookSignature("other", '{"a":1}', sig)).toBe(false);
    expect(verifyWebhookSignature("s3cr3t", '{"a":2}', sig)).toBe(false);
  });

  test("verify is safe against a malformed signature", () => {
    expect(verifyWebhookSignature("s", "b", "not-hex")).toBe(false);
    expect(verifyWebhookSignature("s", "b", "")).toBe(false);
  });
});
