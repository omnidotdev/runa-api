/**
 * Authorization module for Runa.
 *
 * Thin wrapper around @omnidotdev/providers AuthzProvider.
 * Maintains the same API surface for PostGraphile EXPORTABLE compatibility.
 */

import {
  AUTHZ_API_URL,
  AUTHZ_ENABLED,
  AUTHZ_SYNC_MODE,
} from "lib/config/env.config";
import { authz } from "lib/providers";

import type {
  PermissionCheck,
  PermissionCheckResult,
  TupleSyncResult,
} from "@omnidotdev/providers";

/** @knipignore Used by scripts */
export type { TupleSyncResult };

/**
 * Check if AuthZ is enabled and configured.
 * Exported as a function (not a value) so graphile-export handles it correctly.
 */
export function isAuthzEnabled(): boolean {
  return AUTHZ_ENABLED === "true" && !!AUTHZ_API_URL;
}

/**
 * Check if transactional sync mode is enabled.
 * When true, mutations should fail if AuthZ tuple sync fails.
 * @knipignore Used by scripts
 */
export function isTransactionalSyncMode(): boolean {
  return AUTHZ_SYNC_MODE === "transactional";
}

/**
 * Check if a user has permission on a resource.
 * Exported for graphile-export EXPORTABLE compatibility.
 *
 * @param accessToken - JWT access token (kept for API compatibility, auth handled by provider config)
 */
export async function checkPermission(
  userId: string,
  resourceType: string,
  resourceId: string,
  permission: string,
  _accessToken: string,
  requestCache?: Map<string, boolean>,
): Promise<boolean> {
  if (!isAuthzEnabled()) return true;

  return authz.checkPermission(
    userId,
    resourceType,
    resourceId,
    permission,
    requestCache,
  );
}

/**
 * Batch check multiple permissions in a single API call.
 * @knipignore Used by scripts
 */
export async function checkPermissionsBatch(
  checks: PermissionCheck[],
  requestCache?: Map<string, boolean>,
): Promise<PermissionCheckResult[]> {
  if (!isAuthzEnabled()) {
    return checks.map((check) => ({ ...check, allowed: true }));
  }

  if (!authz.checkPermissionsBatch) {
    // Fallback to individual checks
    const results: PermissionCheckResult[] = [];
    for (const check of checks) {
      const allowed = await authz.checkPermission(
        check.userId,
        check.resourceType,
        check.resourceId,
        check.permission,
        requestCache,
      );
      results.push({ ...check, allowed });
    }
    return results;
  }

  return authz.checkPermissionsBatch(checks, requestCache);
}

/**
 * Write tuples to the authorization store.
 */
export async function writeTuples(
  tuples: Array<{ user: string; relation: string; object: string }>,
  accessToken?: string,
): Promise<TupleSyncResult> {
  if (!isAuthzEnabled()) return { success: true };
  if (!authz.writeTuples) return { success: true };

  return authz.writeTuples(tuples, accessToken);
}

/**
 * Delete tuples from the authorization store.
 */
export async function deleteTuples(
  tuples: Array<{ user: string; relation: string; object: string }>,
  accessToken?: string,
): Promise<TupleSyncResult> {
  if (!isAuthzEnabled()) return { success: true };
  if (!authz.deleteTuples) return { success: true };

  return authz.deleteTuples(tuples, accessToken);
}

/**
 * Build a cache key for a permission check.
 * @knipignore Used by scripts
 */
export function buildPermissionCacheKey(
  userId: string,
  resourceType: string,
  resourceId: string,
  permission: string,
): string {
  return `${userId}:${resourceType}:${resourceId}:${permission}`;
}

/**
 * Invalidate cached permissions matching a pattern.
 */
export function invalidatePermissionCache(pattern: string): void {
  authz.invalidateCache?.(pattern);
}

/**
 * Clear all cached permissions.
 * @knipignore Used by scripts
 */
export function clearPermissionCache(): void {
  authz.clearCache?.();
}
