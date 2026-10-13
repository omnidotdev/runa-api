/**
 * HMAC signing for outbound webhooks. Matches the house format used by the
 * inbound IDP receiver (`src/lib/idp/webhooks.ts`): a hex SHA-256 HMAC of the
 * raw request body, compared in constant time. Receivers verify the
 * `x-runa-signature` header the same way to trust a delivery really came from
 * Runa and was not tampered with.
 */

import { createHmac, timingSafeEqual } from "node:crypto";

/** Hex SHA-256 HMAC of `body` under `secret`. */
export const signWebhookBody = (secret: string, body: string): string =>
  createHmac("sha256", secret).update(body).digest("hex");

/** Constant-time check that `signature` is a valid HMAC of `body` under `secret`. */
export const verifyWebhookSignature = (
  secret: string,
  body: string,
  signature: string,
): boolean => {
  try {
    const expected = signWebhookBody(secret, body);
    const a = Buffer.from(signature, "hex");
    const b = Buffer.from(expected, "hex");
    if (a.length !== b.length || a.length === 0) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
};
