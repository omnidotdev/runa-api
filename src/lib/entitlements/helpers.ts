/**
 * High-level entitlement check helpers for authorization plugins.
 * Wraps the entitlements client with caching.
 *
 * Entitlements are queried at the ORGANIZATION level, not workspace level.
 * This enables bundle billing where one subscription covers all Omni products.
 *
 * SECURITY: Fails CLOSED when Aether is unavailable.
 * Users cannot access features without verified entitlements.
 */

import { getCached, setCached } from "./cache";
import { getEntitlements } from "./client";

/** Runa product ID for entitlements */
const PRODUCT_ID = "runa";

/** Cache key prefix */
const CACHE_PREFIX = "organization";

/** Tier type */
type Tier = "free" | "basic" | "team" | "enterprise";

/** Default limits for FREE tier only (used when entitlements found but limit not specified) */
const FREE_TIER_LIMITS: Record<string, number> = {
  max_projects: 2,
  max_tasks: 500,
  max_columns: 5,
  max_labels: 10,
  max_assignees: 1,
  max_members: 3,
  max_admins: 1,
};

interface CachedEntitlements {
  tier: Tier;
  limits: Record<string, number>;
  version: number;
}

/**
 * Result type for entitlement fetch.
 * Distinguishes between successful fetch, not found, and service unavailable.
 */
type FetchResult =
  | { status: "success"; entitlements: CachedEntitlements }
  | { status: "not_found" }
  | { status: "unavailable"; error: string };

/**
 * Fetch and cache entitlements for an organization.
 * Entitlements are at the org level, enabling bundle billing.
 *
 * Returns a result object to let caller decide how to handle unavailability.
 */
async function fetchOrganizationEntitlements(
  organizationId: string,
): Promise<FetchResult> {
  const cacheKey = `${CACHE_PREFIX}:${organizationId}`;

  // Check cache first
  const cached = getCached<CachedEntitlements>(cacheKey);
  if (cached) {
    return { status: "success", entitlements: cached };
  }

  // Fetch from entitlements service using organization entity type
  const result = await getEntitlements(
    "organization",
    organizationId,
    PRODUCT_ID,
  );

  if (result.status === "unavailable") {
    return { status: "unavailable", error: result.error };
  }

  if (result.status === "not_found") {
    return { status: "not_found" };
  }

  // Parse entitlements into a usable format
  const entitlements: CachedEntitlements = {
    tier: "free",
    limits: {},
    version: result.data.entitlementVersion,
  };

  for (const ent of result.data.entitlements) {
    // Check product-specific tier first (runa:tier), then shared tier
    if (ent.featureKey === `${PRODUCT_ID}:tier` || ent.featureKey === "tier") {
      entitlements.tier = (ent.value as Tier) ?? "free";
    } else if (ent.featureKey.startsWith("max_")) {
      // Handle both product-specific (runa:max_projects) and shared (max_projects)
      const key = ent.featureKey.replace(`${PRODUCT_ID}:`, "");
      entitlements.limits[key] =
        typeof ent.value === "number" ? ent.value : Number(ent.value) || -1;
    }
  }

  // Cache the result
  setCached(cacheKey, entitlements, result.data.entitlementVersion);

  return { status: "success", entitlements };
}

/**
 * Error thrown when entitlements service is unavailable.
 * Callers should catch this and return appropriate error to user.
 * @knipignore - exported for plugin error handling
 */
export class EntitlementsUnavailableError extends Error {
  constructor(message: string) {
    super(`Entitlements service unavailable: ${message}`);
    this.name = "EntitlementsUnavailableError";
  }
}

/**
 * Get a specific limit for an organization.
 * Returns -1 for unlimited, or the limit number.
 *
 * SECURITY: Throws EntitlementsUnavailableError if Aether is down.
 * This ensures fail-closed behavior.
 */
async function getOrganizationLimit(
  organizationId: string,
  limitKey: string,
): Promise<number> {
  const result = await fetchOrganizationEntitlements(organizationId);

  if (result.status === "unavailable") {
    throw new EntitlementsUnavailableError(result.error);
  }

  if (result.status === "not_found") {
    // No billing account yet - use free tier limits
    return FREE_TIER_LIMITS[limitKey] ?? -1;
  }

  // Check if we have a specific limit set
  if (limitKey in result.entitlements.limits) {
    return result.entitlements.limits[limitKey];
  }

  // Fall back to free tier default if limit not specified
  return FREE_TIER_LIMITS[limitKey] ?? -1;
}

/**
 * Check if an organization is within its limit for a resource.
 * Returns true if the current count is below the limit.
 * Returns true if the limit is -1 (unlimited).
 *
 * SECURITY: Throws EntitlementsUnavailableError if Aether is down.
 */
export async function checkOrganizationLimit(
  organizationId: string,
  limitKey: string,
  currentCount: number,
): Promise<boolean> {
  const limit = await getOrganizationLimit(organizationId, limitKey);

  // -1 means unlimited
  if (limit === -1) return true;

  return currentCount < limit;
}

/**
 * Check if an organization is within its limit.
 * Queries entitlements at the organization level (bundle billing model).
 * This is the primary function for authorization plugins.
 *
 * SECURITY: Fails CLOSED when Aether is unavailable.
 * Throws EntitlementsUnavailableError which should be caught by the plugin
 * and returned as an error to the user.
 *
 * @param entity - Object with organizationId (settings record or just { organizationId })
 * @param limitKey - The limit key to check (e.g., 'max_projects')
 * @param currentCount - Current count of resources
 * @param billingBypassOrgIds - Organization IDs exempt from billing limits
 */
export async function isWithinLimit(
  entity: { organizationId: string },
  limitKey: string,
  currentCount: number,
  billingBypassOrgIds: string[] = [],
): Promise<boolean> {
  // Bypass check for exempt organizations (e.g., Omni internal orgs)
  if (billingBypassOrgIds.includes(entity.organizationId)) {
    return true;
  }

  return checkOrganizationLimit(entity.organizationId, limitKey, currentCount);
}

/**
 * Get the tier for an organization.
 * Useful for displaying tier in UI.
 *
 * Returns "free" if org not found (no billing account yet).
 * Throws EntitlementsUnavailableError if Aether is down.
 *
 * @knipignore - exported for UI tier display
 */
export async function getOrganizationTier(
  organizationId: string,
): Promise<Tier> {
  const result = await fetchOrganizationEntitlements(organizationId);

  if (result.status === "unavailable") {
    throw new EntitlementsUnavailableError(result.error);
  }

  if (result.status === "not_found") {
    return "free";
  }

  return result.entitlements.tier;
}
