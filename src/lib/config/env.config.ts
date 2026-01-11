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
  BILLING_BYPASS_SLUGS,
  ENTITLEMENTS_BASE_URL,
  ENTITLEMENTS_WEBHOOK_SECRET,
  // AuthZ (PDP)
  AUTHZ_PROVIDER_URL,
  AUTHZ_ENABLED,
} = process.env;

export const isDevEnv = NODE_ENV === "development",
  isProdEnv = NODE_ENV === "production",
  protectRoutes = isProdEnv || PROTECT_ROUTES === "true";
