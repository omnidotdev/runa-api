/**
 * Environment variables.
 */
export const {
  NODE_ENV,
  PORT = 4000,
  // https://stackoverflow.com/a/68578294
  HOST = "0.0.0.0",
  DATABASE_URL,
  AUTH_BASE_URL,
  GRAPHQL_COMPLEXITY_MAX_COST,
  CORS_ALLOWED_ORIGINS,
  PROTECT_ROUTES,
  AUTH_DEBUG,
  BILLING_BYPASS_ORG_IDS,
  ENTITLEMENTS_BASE_URL,
  ENTITLEMENTS_WEBHOOK_SECRET,
  // AuthZ - feature flag and PDP URL for permission checks
  AUTHZ_ENABLED,
  AUTHZ_PROVIDER_URL,
  // IDP webhook
  IDP_WEBHOOK_SECRET,
  // Vortex workflow engine (for authz tuple sync)
  VORTEX_API_URL,
  VORTEX_WEBHOOK_SECRET,
  VORTEX_AUTHZ_WORKFLOW_ID,
  // Feature flags
  FLAGS_API_HOST,
  FLAGS_CLIENT_KEY,
} = process.env;

export const isDevEnv = NODE_ENV === "development";
export const isProdEnv = NODE_ENV === "production";
export const protectRoutes = isProdEnv || PROTECT_ROUTES === "true";
