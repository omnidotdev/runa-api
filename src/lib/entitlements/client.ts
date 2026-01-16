import { ENTITLEMENTS_BASE_URL } from "lib/config/env.config";

/** Request timeout in milliseconds */
const REQUEST_TIMEOUT_MS = 5000;

/** Circuit breaker failure threshold */
const CIRCUIT_BREAKER_THRESHOLD = 5;

/** Circuit breaker cooldown in milliseconds */
const CIRCUIT_BREAKER_COOLDOWN_MS = 30000;

interface EntitlementsResponse {
  billingAccountId: string;
  entityType: string;
  entityId: string;
  entitlementVersion: number;
  entitlements: Array<{
    id: string;
    productId: string;
    featureKey: string;
    value: string | null;
    source: string;
    validFrom: string;
    validUntil: string | null;
  }>;
}

/**
 * Result type for entitlements fetch.
 * Distinguishes between "service unavailable" and "no entitlements found".
 */
export type EntitlementsResult =
  | { status: "success"; data: EntitlementsResponse }
  | { status: "not_found" }
  | { status: "unavailable"; error: string };

/**
 * Circuit breaker for entitlements service.
 * Prevents thundering herd on Aether outage.
 */
class EntitlementsCircuitBreaker {
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
      // biome-ignore lint/suspicious/noConsole: circuit breaker logging
      console.error(
        `[Entitlements] Circuit breaker OPEN after ${this.failures} failures`,
      );
    }
  }
}

const circuitBreaker = new EntitlementsCircuitBreaker();

/**
 * Get all entitlements for an entity.
 * Optionally filter by product.
 *
 * Returns a result object to distinguish between:
 * - success: entitlements found
 * - not_found: entity has no entitlements (404)
 * - unavailable: service error (caller decides how to handle)
 */
export async function getEntitlements(
  entityType: string,
  entityId: string,
  productId?: string,
): Promise<EntitlementsResult> {
  if (!ENTITLEMENTS_BASE_URL) {
    return {
      status: "unavailable",
      error: "ENTITLEMENTS_BASE_URL not configured",
    };
  }

  if (circuitBreaker.isOpen()) {
    return { status: "unavailable", error: "Circuit breaker open" };
  }

  try {
    const url = new URL(
      `${ENTITLEMENTS_BASE_URL}/entitlements/${entityType}/${entityId}`,
    );
    if (productId) {
      url.searchParams.set("productId", productId);
    }

    const res = await fetch(url, {
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (res.ok) {
      circuitBreaker.recordSuccess();
      const data = await res.json();
      return { status: "success", data };
    }

    if (res.status === 404) {
      circuitBreaker.recordSuccess();
      return { status: "not_found" };
    }

    // Other error status
    circuitBreaker.recordFailure();
    return { status: "unavailable", error: `HTTP ${res.status}` };
  } catch (error) {
    circuitBreaker.recordFailure();
    const message = error instanceof Error ? error.message : String(error);
    return { status: "unavailable", error: message };
  }
}
