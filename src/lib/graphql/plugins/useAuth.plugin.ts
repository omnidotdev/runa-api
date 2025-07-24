import { createHash } from "node:crypto";
import { useGenericAuth } from "@envelop/generic-auth";
import type * as jose from "jose";

import { AUTH_BASE_URL, protectRoutes } from "lib/config/env.config";
import { userTable } from "lib/db/schema";
import type { GraphQLContext } from "lib/graphql/createGraphqlContext";

import type { ResolveUserFn } from "@envelop/generic-auth";
import type { InsertUser, SelectUser } from "lib/db/schema";

// Cache configuration
interface CacheConfig {
  ttlMs: number;
  cleanupIntervalMs: number;
  maxEntries: number;
}

const DEFAULT_CACHE_CONFIG: CacheConfig = {
  ttlMs: 5 * 60 * 1000, // 5 minutes
  cleanupIntervalMs: 10 * 60 * 1000, // 10 minutes
  maxEntries: 1000, // Maximum number of cached entries
};

interface CacheEntry {
  user: SelectUser;
  expiresAt: number;
}

// In-memory cache for user info
const userInfoCache = new Map<string, CacheEntry>();

// Cache statistics for monitoring
let cacheStats = {
  hits: 0,
  misses: 0,
  evictions: 0,
};

// Cleanup expired entries and enforce max size
function cleanupCache(config: CacheConfig = DEFAULT_CACHE_CONFIG): void {
  const now = Date.now();
  let evictedCount = 0;

  // Remove expired entries
  for (const [key, entry] of userInfoCache.entries()) {
    if (entry.expiresAt < now) {
      userInfoCache.delete(key);
      evictedCount++;
    }
  }

  // Enforce max entries (LRU-style eviction)
  if (userInfoCache.size > config.maxEntries) {
    const entriesToRemove = userInfoCache.size - config.maxEntries;
    const entries = Array.from(userInfoCache.entries());

    // Sort by expiration time (oldest first)
    entries.sort((a, b) => a[1].expiresAt - b[1].expiresAt);

    for (let i = 0; i < entriesToRemove; i++) {
      userInfoCache.delete(entries[i][0]);
      evictedCount++;
    }
  }

  cacheStats.evictions += evictedCount;

  if (evictedCount > 0) {
    console.debug(
      `Auth cache cleanup: evicted ${evictedCount} entries, current size: ${userInfoCache.size}`,
    );
  }
}

// Cleanup expired entries periodically
setInterval(() => {
  cleanupCache();
}, DEFAULT_CACHE_CONFIG.cleanupIntervalMs);

/**
 * Create a cache key from access token (hashed for security)
 */
function createCacheKey(accessToken: string): string {
  return createHash("sha256").update(accessToken).digest("hex");
}

/**
 * Get cached user object if available and not expired
 */
function getCachedUser(accessToken: string): SelectUser | null {
  const cacheKey = createCacheKey(accessToken);
  const entry = userInfoCache.get(cacheKey);

  if (!entry) {
    cacheStats.misses++;
    return null;
  }

  if (entry.expiresAt < Date.now()) {
    userInfoCache.delete(cacheKey);
    cacheStats.misses++;
    return null;
  }

  cacheStats.hits++;
  return entry.user;
}

/**
 * Cache user object with TTL
 */
function setCachedUser(
  accessToken: string,
  user: SelectUser,
  config: CacheConfig = DEFAULT_CACHE_CONFIG,
): void {
  const cacheKey = createCacheKey(accessToken);
  const expiresAt = Date.now() + config.ttlMs;

  userInfoCache.set(cacheKey, {
    user,
    expiresAt,
  });

  // Trigger cleanup if cache is getting large
  if (userInfoCache.size > config.maxEntries * 1.1) {
    cleanupCache(config);
  }
}

/**
 * Get cache statistics for monitoring
 */
export function getCacheStats() {
  return {
    ...cacheStats,
    size: userInfoCache.size,
    hitRate:
      cacheStats.hits > 0
        ? cacheStats.hits / (cacheStats.hits + cacheStats.misses)
        : 0,
  };
}

/**
 * Clear the entire cache
 */
export function clearCache(): void {
  userInfoCache.clear();
  cacheStats = {
    hits: 0,
    misses: 0,
    evictions: 0,
  };
}

// TODO research best practices for all of this file (token validation, caching, etc.). Validate access token (introspection endpoint)? Cache userinfo output? etc. (https://linear.app/omnidev/issue/OMNI-302/increase-security-of-useauth-plugin)

/**
 * Validate user session and resolve user if successful.
 * @see https://the-guild.dev/graphql/envelop/plugins/use-generic-auth#getting-started
 */
const resolveUser: ResolveUserFn<SelectUser, GraphQLContext> = async (ctx) => {
  try {
    const accessToken = ctx.request.headers
      .get("authorization")
      ?.split("Bearer ")[1];

    if (!accessToken) {
      if (!protectRoutes) return null;

      throw new Error("Invalid or missing access token");
    }

    // TODO validate access token (introspection endpoint?) here?

    // Check cache first
    let user = getCachedUser(accessToken);

    if (!user) {
      // Cache miss - fetch from userinfo endpoint and create/update user
      console.debug(
        "Auth cache miss, fetching user info from external service",
      );

      const userInfo = await fetch(`${AUTH_BASE_URL}/oauth2/userinfo`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!userInfo.ok) {
        if (!protectRoutes) return null;

        throw new Error("Invalid access token or request failed");
      }

      const idToken: jose.JWTPayload = await userInfo.json();

      // TODO validate token, currently major security flaw (pending BA OIDC JWKS support: https://www.better-auth.com/docs/plugins/oidc-provider#jwks-endpoint-not-fully-implemented) (https://linear.app/omnidev/issue/OMNI-302/validate-id-token-with-jwks)
      // const jwks = jose.createRemoteJWKSet(new URL(`${AUTH_BASE_URL}/jwks`));
      // const { payload } = await jose.jwtVerify(JSON.stringify(idToken), jwks);
      // if (!payload) throw new Error("Failed to verify token");

      const insertedUser: InsertUser = {
        identityProviderId: idToken.sub!,
        name: idToken.preferred_username as string,
        email: idToken.email as string,
      };

      const { identityProviderId, ...rest } = insertedUser;

      const [dbUser] = await ctx.db
        .insert(userTable)
        .values(insertedUser)
        .onConflictDoUpdate({
          target: userTable.identityProviderId,
          set: {
            ...rest,
            updatedAt: new Date().toISOString(),
          },
        })
        .returning();

      user = dbUser;

      // Cache the complete user object
      setCachedUser(accessToken, user);
      console.debug("User object cached successfully");
    } else {
      console.debug("Auth cache hit, using cached user object");
    }

    return user;
  } catch (err) {
    console.error(err);

    return null;
  }
};

/**
 * Authentication plugin.
 */
const useAuth = () =>
  useGenericAuth({
    contextFieldName: "observer",
    resolveUserFn: resolveUser,
    mode: protectRoutes ? "protect-all" : "resolve-only",
  });

export default useAuth;
