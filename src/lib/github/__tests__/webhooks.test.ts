import { describe, expect, test } from "bun:test";
import { createHmac } from "node:crypto";

import { verifyGitHubSignature } from "../webhooks";

// ─────────────────────────────────────────────
// verifyGitHubSignature
// ─────────────────────────────────────────────

const SECRET = "test-webhook-secret";

function signPayload(payload: string, secret: string): string {
  const hmac = createHmac("sha256", secret).update(payload).digest("hex");
  return `sha256=${hmac}`;
}

describe("verifyGitHubSignature", () => {
  test("returns true for valid HMAC-SHA256 signature", () => {
    const payload = '{"action":"created"}';
    const signature = signPayload(payload, SECRET);

    expect(verifyGitHubSignature(payload, signature, SECRET)).toBe(true);
  });

  test("returns false for invalid signature", () => {
    const payload = '{"action":"created"}';
    const wrongSignature = signPayload(payload, "wrong-secret");

    expect(verifyGitHubSignature(payload, wrongSignature, SECRET)).toBe(false);
  });

  test("returns false for wrong-length signature", () => {
    const payload = '{"action":"created"}';

    expect(verifyGitHubSignature(payload, "sha256=tooshort", SECRET)).toBe(
      false,
    );
  });

  test("returns false for malformed signature", () => {
    const payload = '{"action":"created"}';

    expect(verifyGitHubSignature(payload, "not-a-valid-sig", SECRET)).toBe(
      false,
    );
  });

  test("returns false for empty signature", () => {
    const payload = '{"action":"created"}';

    expect(verifyGitHubSignature(payload, "", SECRET)).toBe(false);
  });

  test("handles empty payload", () => {
    const payload = "";
    const signature = signPayload(payload, SECRET);

    expect(verifyGitHubSignature(payload, signature, SECRET)).toBe(true);
  });

  test("handles large payload", () => {
    const payload = JSON.stringify({
      action: "created",
      installation: { id: 12345, account: { login: "test-org" } },
      data: "x".repeat(10000),
    });
    const signature = signPayload(payload, SECRET);

    expect(verifyGitHubSignature(payload, signature, SECRET)).toBe(true);
  });
});
