/**
 * IDP organization validation.
 *
 * Validates that an organization exists in the IDP before creating resources.
 *
 * SECURITY: Fails CLOSED when IDP is unavailable.
 * Cannot create resources for organizations we can't verify.
 */

import { AUTH_BASE_URL } from "lib/config/env.config";

/** Cache TTL for positive results (org exists) in milliseconds */
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/** Request timeout in milliseconds */
const REQUEST_TIMEOUT_MS = 5000;

/** Circuit breaker failure threshold */
const CIRCUIT_BREAKER_THRESHOLD = 5;

/** Circuit breaker cooldown in milliseconds */
const CIRCUIT_BREAKER_COOLDOWN_MS = 30000;

/** Cache for organization existence checks */
const orgExistsCache = new Map<
  string,
  { exists: boolean; expiresAt: number }
>();

/**
 * Error thrown when IDP is unavailable.
 * @knipignore - exported for plugin error handling
 */
export class IdpUnavailableError extends Error {
  constructor(message: string) {
    super(`IDP unavailable: ${message}`);
    this.name = "IdpUnavailableError";
  }
}

/**
 * Circuit breaker for IDP calls.
 */
class IdpCircuitBreaker {
  private failures = 0;
  private state: "closed" | "open" | "half-open" = "closed";
  private lastFailure = 0;

  isOpen(): boolean {
    if (this.state === "open") {
      if (Date.now() - this.lastFailure > CIRCUIT_BREAKER_COOLDOWN_MS) {
        this.state = "half-open";
        return false;
      }
      return true;
    }
    return false;
  }

  recordSuccess(): void {
    this.failures = 0;
    this.state = "closed";
  }

  recordFailure(): void {
    this.failures++;
    this.lastFailure = Date.now();
    if (this.failures >= CIRCUIT_BREAKER_THRESHOLD) {
      this.state = "open";
      console.error(
        `[IDP] Circuit breaker OPEN after ${this.failures} failures`,
      );
    }
  }
}

const circuitBreaker = new IdpCircuitBreaker();

/**
 * Check if an organization exists in the IDP.
 *
 * - Caches positive results for 5 minutes
 * - Does NOT cache negative results (org might be in propagation delay)
 * - SECURITY: Fails CLOSED if IDP is unavailable (throws IdpUnavailableError)
 *
 * @param organizationId - The organization ID to validate
 * @returns true if org exists, false if org confirmed not to exist
 * @throws IdpUnavailableError if IDP cannot be reached
 */
export async function validateOrgExists(
  organizationId: string,
): Promise<boolean> {
  if (!AUTH_BASE_URL) {
    throw new IdpUnavailableError("AUTH_BASE_URL not configured");
  }

  // Check cache first
  const cached = orgExistsCache.get(organizationId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.exists;
  }

  if (circuitBreaker.isOpen()) {
    throw new IdpUnavailableError("Circuit breaker open");
  }

  try {
    // Query IDP for organization existence
    // Using the Better Auth organization API endpoint
    const response = await fetch(
      `${AUTH_BASE_URL}/api/organization/${organizationId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      },
    );

    if (response.ok) {
      circuitBreaker.recordSuccess();
      // Cache positive result
      orgExistsCache.set(organizationId, {
        exists: true,
        expiresAt: Date.now() + CACHE_TTL_MS,
      });
      return true;
    }

    if (response.status === 404) {
      circuitBreaker.recordSuccess();
      // Org confirmed not to exist - don't cache (might be propagation delay)
      console.warn(`[IDP] Organization ${organizationId} not found in IDP`);
      return false;
    }

    // Other error status - fail closed
    circuitBreaker.recordFailure();
    throw new IdpUnavailableError(`HTTP ${response.status}`);
  } catch (error) {
    if (error instanceof IdpUnavailableError) {
      throw error;
    }
    // Network error or timeout - fail closed
    circuitBreaker.recordFailure();
    const message = error instanceof Error ? error.message : String(error);
    throw new IdpUnavailableError(message);
  }
}

/**
 * Clear the organization cache (useful for testing).
 * @knipignore - exported for testing
 */
export function clearOrgCache(): void {
  orgExistsCache.clear();
}
