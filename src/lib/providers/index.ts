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
} from "@omnidotdev/providers";

import {
  AUTHZ_API_URL,
  BILLING_BASE_URL,
  BILLING_SERVICE_API_KEY,
  VORTEX_API_KEY,
  VORTEX_API_URL,
  VORTEX_AUTHZ_WEBHOOK_SECRET,
  WARDEN_SERVICE_KEY,
} from "lib/config/env.config";

export const authz = createAuthzProvider({
  apiUrl: AUTHZ_API_URL,
  serviceKey: WARDEN_SERVICE_KEY,
  vortexUrl: VORTEX_API_URL,
  vortexWebhookSecret: VORTEX_AUTHZ_WEBHOOK_SECRET,
  source: "runa",
});

export const billing = createBillingProvider({
  baseUrl: BILLING_BASE_URL,
  serviceApiKey: BILLING_SERVICE_API_KEY,
  appId: "runa",
});

/** @knipignore */
export const events = createEventsProvider(
  VORTEX_API_URL
    ? {
        provider: "http",
        baseUrl: VORTEX_API_URL,
        apiKey: VORTEX_API_KEY,
        source: "omni.runa",
      }
    : {},
);
