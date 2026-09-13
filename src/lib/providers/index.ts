/**
 * Shared provider instances for Runa.
 *
 * Instantiates authorization and billing providers from @omnidotdev/providers
 * with Runa-specific configuration from environment variables.
 */

import {
  createAuthzProvider,
  createBillingProvider,
  createEventsProvider,
  createFlagProvider,
  createNotificationProvider,
  createStorageProvider,
} from "@omnidotdev/providers";

import {
  AUTHZ_API_URL,
  AUTHZ_SERVICE_KEY,
  BILLING_BASE_URL,
  BILLING_SERVICE_API_KEY,
  FLAGS_API_HOST,
  FLAGS_CLIENT_KEY,
  HERALD_API_KEY,
  HERALD_API_URL,
  HERALD_FROM_EMAIL,
  S3_ACCESS_KEY_ID,
  S3_BUCKET,
  S3_ENDPOINT,
  S3_PUBLIC_BASE_URL,
  S3_REGION,
  S3_SECRET_ACCESS_KEY,
  VORTEX_API_KEY,
  VORTEX_API_URL,
  VORTEX_AUTHZ_WEBHOOK_SECRET,
} from "lib/config/env.config";

export const authz = AUTHZ_API_URL
  ? createAuthzProvider({
      apiUrl: AUTHZ_API_URL,
      serviceKey: AUTHZ_SERVICE_KEY,
      vortexUrl: VORTEX_API_URL,
      vortexWebhookSecret: VORTEX_AUTHZ_WEBHOOK_SECRET,
      source: "runa",
    })
  : undefined;

export const billing = BILLING_BASE_URL
  ? createBillingProvider({
      provider: "aether",
      baseUrl: BILLING_BASE_URL,
      serviceApiKey: BILLING_SERVICE_API_KEY,
      appId: "runa",
    })
  : undefined;

export const events = createEventsProvider(
  VORTEX_API_URL && VORTEX_API_KEY
    ? {
        provider: "http",
        baseUrl: VORTEX_API_URL,
        apiKey: VORTEX_API_KEY,
        source: "omni.runa",
      }
    : {},
);

/**
 * Transactional email for notifications.
 *
 * Uses Herald (the Omni org-mail product) when `HERALD_API_URL`/`HERALD_API_KEY`/
 * `HERALD_FROM_EMAIL` are configured, otherwise falls back to the noop provider
 * so the app boots without email configuration (sends succeed as no-ops). The
 * provider returns `{ success: false }` instead of throwing, so a failed send
 * never crashes a request handler.
 */
export const notifications = createNotificationProvider(
  HERALD_API_URL && HERALD_API_KEY && HERALD_FROM_EMAIL
    ? {
        provider: "herald",
        apiUrl: HERALD_API_URL,
        apiKey: HERALD_API_KEY,
        defaultFrom: HERALD_FROM_EMAIL,
      }
    : {},
);

export const flags = createFlagProvider(
  FLAGS_API_HOST
    ? {
        provider: "unleash",
        url: FLAGS_API_HOST,
        apiKey: FLAGS_CLIENT_KEY!,
        appName: "runa-api",
      }
    : {},
);

/**
 * Object storage for task attachments.
 *
 * Uses an S3-compatible backend (Garage in prod via FractalObjectStorage, MinIO
 * for self-host) when `S3_BUCKET` is configured, otherwise falls back to the
 * noop provider so the app boots without storage configuration (uploads succeed
 * but bytes are not persisted).
 */
export const storage = createStorageProvider(
  S3_BUCKET
    ? {
        provider: "s3",
        bucket: S3_BUCKET,
        region: S3_REGION,
        endpoint: S3_ENDPOINT,
        publicBaseUrl: S3_PUBLIC_BASE_URL,
        // Garage and MinIO require path-style addressing; the default only
        // enables it for localhost, so virtual-host requests fail to resolve
        forcePathStyle: true,
        credentials:
          S3_ACCESS_KEY_ID && S3_SECRET_ACCESS_KEY
            ? {
                accessKeyId: S3_ACCESS_KEY_ID,
                secretAccessKey: S3_SECRET_ACCESS_KEY,
              }
            : undefined,
      }
    : {},
);
