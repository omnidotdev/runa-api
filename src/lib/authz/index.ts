/**
 * Authorization module for Runa.
 *
 * Thin wrapper around @omnidotdev/providers AuthzProvider.
 * Maintains the same API surface for PostGraphile EXPORTABLE compatibility.
 */

import { AUTHZ_API_URL, AUTHZ_SYNC_MODE } from "lib/config/env.config";
import { authz } from "lib/providers";
import {
  enqueueWardenSync,
  startWardenSyncPoller,
  stopWardenSyncPoller,
} from "./syncQueue";

import type {
  PermissionCheck,
  PermissionCheckResult,
  TupleSyncResult,
  WardenRelation,
  WardenResourceType,
} from "@omnidotdev/providers";

/** @knipignore Used by scripts */
export type { TupleSyncResult };

export { startWardenSyncPoller };

/** @knipignore Re-exported for API completeness; used internally and by scripts */
export { enqueueWardenSync, stopWardenSyncPoller };

/**
 * Check if AuthZ is enabled and configured.
 * Exported as a function (not a value) so graphile-export handles it correctly.
 */
export function isAuthzEnabled(): boolean {
  return !!AUTHZ_API_URL;
}

/**
 * Check if transactional sync mode is enabled.
 * When true, mutations should fail if AuthZ tuple sync fails.
 * Defaults to transactional to prevent silent tuple loss
 */
export function isTransactionalSyncMode(): boolean {
  return AUTHZ_SYNC_MODE !== "best-effort";
}

/**
 * Check if a user has permission on a resource.
 * Exported for graphile-export EXPORTABLE compatibility.
 *
 * @param accessToken - JWT access token (kept for API compatibility, auth handled by provider config)
 */
export async function checkPermission<T extends WardenResourceType>(
  userId: string,
  resourceType: T,
  resourceId: string,
  permission: WardenRelation<T>,
  _accessToken: string,
  requestCache?: Map<string, boolean>,
): Promise<boolean> {
  if (!isAuthzEnabled()) return true;

  // Safe: isAuthzEnabled() guarantees authz is defined (AUTHZ_API_URL is set)
  return authz!.checkPermission(
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

  // Safe: isAuthzEnabled() guarantees authz is defined (AUTHZ_API_URL is set)
  if (!authz!.checkPermissionsBatch) {
    const results: PermissionCheckResult[] = [];
    for (const check of checks) {
      const allowed = await authz!.checkPermission(
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

  return authz!.checkPermissionsBatch(checks, requestCache);
}

/**
 * Write tuples to the authorization store.
 */
export async function writeTuples(
  tuples: Array<{ user: string; relation: string; object: string }>,
  accessToken?: string,
): Promise<TupleSyncResult> {
  if (!isAuthzEnabled()) return { success: true };
  if (!authz!.writeTuples) return { success: true };

  const result = await authz!.writeTuples(tuples, accessToken);

  // Only enqueue in best-effort mode. In transactional mode the plugin throws
  // and the mutation rolls back, so a queued retry would orphan a tuple for a
  // resource that no longer exists
  if (!result.success && !isTransactionalSyncMode()) {
    await enqueueWardenSync("write", tuples, result.error);
  }

  return result;
}

/**
 * Delete tuples from the authorization store.
 */
export async function deleteTuples(
  tuples: Array<{ user: string; relation: string; object: string }>,
  accessToken?: string,
): Promise<TupleSyncResult> {
  if (!isAuthzEnabled()) return { success: true };
  if (!authz!.deleteTuples) return { success: true };

  const result = await authz!.deleteTuples(tuples, accessToken);

  // Only enqueue in best-effort mode. In transactional mode the plugin throws
  // and the mutation rolls back, so a queued retry would orphan a tuple for a
  // resource that no longer exists
  if (!result.success && !isTransactionalSyncMode()) {
    await enqueueWardenSync("delete", tuples, result.error);
  }

  return result;
}

/**
 * Build a cache key for a permission check.
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
  authz?.invalidateCache?.(pattern);
}

/**
 * Clear all cached permissions.
 * @knipignore Used by scripts
 */
export function clearPermissionCache(): void {
  authz?.clearCache?.();
}
