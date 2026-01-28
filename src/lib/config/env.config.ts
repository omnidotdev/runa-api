/**
 * Environment variables.
 */
export const {
  NODE_ENV,
  PORT = 4000,
  // https://stackoverflow.com/a/68578294
  HOST = "0.0.0.0",
  DATABASE_URL,
  // Self-hosted auth
  AUTH_SECRET,
  AUTH_BASE_URL,
  GRAPHQL_MAX_COMPLEXITY_COST,
  CORS_ALLOWED_ORIGINS,
  PROTECT_ROUTES,
  AUTH_DEBUG,
  BILLING_BYPASS_ORG_IDS,
  BILLING_BASE_URL,
  BILLING_WEBHOOK_SECRET,
  BILLING_SERVICE_API_KEY,
  // AuthZ - feature flag and PDP URL for permission checks
  AUTHZ_ENABLED,
  AUTHZ_API_URL,
  AUTHZ_SYNC_MODE,
  // IDP webhook
  IDP_WEBHOOK_SECRET,
  // Vortex workflow engine (for durable authz tuple sync)
  VORTEX_API_URL,
  VORTEX_AUTHZ_WEBHOOK_SECRET,
  // Service key for Warden API (service-to-service auth)
  WARDEN_SERVICE_KEY,
  // Feature flags
  FLAGS_API_HOST,
  FLAGS_CLIENT_KEY,
  // Self-hosted mode
  SELF_HOSTED,
} = process.env;

export const isDevEnv = NODE_ENV === "development";
export const isProdEnv = NODE_ENV === "production";
export const protectRoutes = isProdEnv || PROTECT_ROUTES === "true";
export const isSelfHosted = SELF_HOSTED === "true";
