/**
 * Environment variables.
 */
export const {
  NODE_ENV,
  PORT = 4000,
  // https://stackoverflow.com/a/68578294
  HOST = "0.0.0.0",
  DATABASE_URL,
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

  AUTHZ_API_URL,
  AUTHZ_SYNC_MODE,
  // IDP webhook
  IDP_WEBHOOK_SECRET,
  // Vortex workflow engine (for durable authz tuple sync)
  VORTEX_API_URL,
  VORTEX_AUTHZ_WEBHOOK_SECRET,
  /** Vortex event streaming API key */
  VORTEX_API_KEY,
  // Service key for AuthZ API (service-to-service auth)
  AUTHZ_SERVICE_KEY,
  // Feature flags
  FLAGS_API_HOST,
  FLAGS_CLIENT_KEY,
  // Build metadata
  BUILD_VERSION,
  // Meilisearch (unified search)
  MEILISEARCH_URL,
  MEILISEARCH_MASTER_KEY,
  // Content moderation (Say Less). When unset, moderation is a noop (content
  // always allowed).
  SAY_LESS_URL,
  // Image moderation (See Less). When unset, image moderation is a noop. URL of
  // the See Less service plus the API key it authenticates callers with.
  SEE_LESS_API_URL,
  SEE_LESS_API_KEY,
  // Object storage for task attachments (S3-compatible: Garage in prod, MinIO self-host)
  S3_BUCKET,
  S3_REGION,
  S3_ENDPOINT,
  S3_ACCESS_KEY_ID,
  S3_SECRET_ACCESS_KEY,
  // Optional CDN/public base URL override for stored objects
  S3_PUBLIC_BASE_URL,
  // Public base URL of this API, used to build proxied attachment URLs
  PUBLIC_API_URL,
} = process.env;

export const isDevEnv = NODE_ENV === "development";
export const isProdEnv = NODE_ENV === "production";
export const protectRoutes = isProdEnv || PROTECT_ROUTES === "true";

/** Whether search indexing is enabled */
export const isSearchEnabled = !!MEILISEARCH_URL && !!MEILISEARCH_MASTER_KEY;

/** Whether object storage (attachments) is configured */
export const isStorageEnabled = !!S3_BUCKET;

/** Whether content moderation (Say Less) is configured */
export const isModerationEnabled = !!SAY_LESS_URL;

/** Whether image moderation (See Less) is configured */
export const isImageModerationEnabled = !!SEE_LESS_API_URL;

// Startup warnings for optional integrations
if (!BILLING_BASE_URL)
  console.warn("BILLING_BASE_URL not set, billing disabled");
if (!AUTHZ_API_URL)
  console.warn("AUTHZ_API_URL not set, authorization disabled");
if (!VORTEX_API_URL)
  console.warn("VORTEX_API_URL not set, event streaming disabled");
if (!VORTEX_API_KEY)
  console.warn("VORTEX_API_KEY not set, event streaming auth disabled");
if (!AUTHZ_SERVICE_KEY)
  console.warn("AUTHZ_SERVICE_KEY not set, AuthZ service auth disabled");
if (!FLAGS_API_HOST)
  console.warn("FLAGS_API_HOST not set, feature flags disabled");
if (!MEILISEARCH_URL) console.warn("MEILISEARCH_URL not set, search disabled");
if (!S3_BUCKET)
  console.warn("S3_BUCKET not set, task attachments disabled (uploads no-op)");
if (!SAY_LESS_URL)
  console.warn("SAY_LESS_URL not set, content moderation disabled");
if (!SEE_LESS_API_URL)
  console.warn("SEE_LESS_API_URL not set, image moderation disabled");
