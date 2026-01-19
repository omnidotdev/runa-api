import { createHmac, timingSafeEqual } from "node:crypto";

import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { BILLING_WEBHOOK_SECRET } from "lib/config/env.config";
import { dbPool } from "lib/db/db";
import { settings } from "lib/db/schema";
import { invalidateCache } from "./cache";

interface EntitlementWebhookPayload {
  eventType: string;
  entityType: string;
  entityId: string;
  productId: string;
  featureKey?: string;
  value?: unknown;
  version: number;
  timestamp: string;
  billingAccountId?: string;
}

/**
 * Verify HMAC-SHA256 signature from the entitlements service.
 */
const verifySignature = (
  payload: string,
  signature: string,
  secret: string,
): boolean => {
  try {
    const expectedSignature = createHmac("sha256", secret)
      .update(payload)
      .digest("hex");

    const signatureBuffer = Buffer.from(signature, "hex");
    const expectedBuffer = Buffer.from(expectedSignature, "hex");

    if (signatureBuffer.length !== expectedBuffer.length) {
      return false;
    }

    return timingSafeEqual(signatureBuffer, expectedBuffer);
  } catch {
    return false;
  }
};

/**
 * Entitlements webhook receiver.
 * Receives entitlement change events from the billing service (Aether).
 *
 * Entitlements are managed at the ORGANIZATION level for bundle billing.
 * This webhook invalidates cached entitlements when they change.
 */
const entitlementsWebhook = new Elysia({ prefix: "/webhooks" }).post(
  "/entitlements",
  async ({ request, headers, set }) => {
    const signature = headers["x-billing-signature"];

    if (!BILLING_WEBHOOK_SECRET) {
      // In development, allow without signature
      console.warn(
        "BILLING_WEBHOOK_SECRET not set - skipping signature verification",
      );
    }

    try {
      const rawBody = await request.text();

      // Verify signature if secret is configured
      if (BILLING_WEBHOOK_SECRET && signature) {
        const isValid = verifySignature(
          rawBody,
          signature,
          BILLING_WEBHOOK_SECRET,
        );

        if (!isValid) {
          set.status = 401;
          return { error: "Invalid signature" };
        }
      } else if (BILLING_WEBHOOK_SECRET && !signature) {
        set.status = 401;
        return { error: "Missing signature" };
      }

      const body = JSON.parse(rawBody) as EntitlementWebhookPayload;

      // biome-ignore lint/suspicious/noConsole: webhook logging
      console.log(
        `Entitlement event received: ${body.eventType} for ${body.entityType}/${body.entityId}`,
      );

      // Handle events - invalidate local cache
      switch (body.eventType) {
        case "entitlement.created":
        case "entitlement.updated":
        case "entitlement.deleted":
          // Entitlements are at the organization level (bundle billing)
          // Invalidate cached entitlements for this organization
          invalidateCache(`organization:${body.entityId}:*`);
          invalidateCache(`organization:${body.entityId}`);

          // biome-ignore lint/suspicious/noConsole: webhook logging
          console.log(`Cache invalidated for organization ${body.entityId}`);

          // Sync billingAccountId to settings if provided and entity is an organization
          if (body.billingAccountId && body.entityType === "organization") {
            try {
              await dbPool
                .update(settings)
                .set({ billingAccountId: body.billingAccountId })
                .where(eq(settings.organizationId, body.entityId));

              // biome-ignore lint/suspicious/noConsole: webhook logging
              console.log(
                `Updated billingAccountId for organization ${body.entityId}`,
              );
            } catch (dbError) {
              console.error(
                `Failed to update billingAccountId for organization ${body.entityId}:`,
                dbError,
              );
              // Don't fail the webhook - billingAccountId sync is best-effort
            }
          }
          break;
        default:
          break;
      }

      set.status = 200;
      return { received: true };
    } catch (err) {
      console.error("Error processing entitlements webhook:", err);
      set.status = 500;
      return { error: "Internal Server Error" };
    }
  },
  {
    headers: t.Object({
      "x-billing-signature": t.Optional(t.String()),
    }),
  },
);

export default entitlementsWebhook;
