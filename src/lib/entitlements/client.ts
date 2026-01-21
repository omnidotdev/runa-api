import {
  BILLING_BASE_URL,
  BILLING_SERVICE_API_KEY,
  isSelfHosted,
} from "lib/config/env.config";

/** Request timeout in milliseconds */
const REQUEST_TIMEOUT_MS = 5000;

/** Circuit breaker failure threshold */
const CIRCUIT_BREAKER_THRESHOLD = 5;

/** Circuit breaker cooldown in milliseconds */
const CIRCUIT_BREAKER_COOLDOWN_MS = 30000;

/**
 * Default entitlements for self-hosted mode (all features unlocked).
 */
const SELF_HOSTED_ENTITLEMENTS: EntitlementsResponse = {
  billingAccountId: "self-hosted",
  entityType: "organization",
  entityId: "self-hosted",
  entitlementVersion: 1,
  entitlements: [
    {
      id: "sh-tier",
      featureKey: "tier",
      value: "enterprise",
      appId: "runa",
      source: "self-hosted",
      validFrom: "2020-01-01T00:00:00Z",
      validUntil: null,
    },
    {
      id: "sh-max-projects",
      featureKey: "max_projects",
      value: "-1",
      appId: "runa",
      source: "self-hosted",
      validFrom: "2020-01-01T00:00:00Z",
      validUntil: null,
    },
    {
      id: "sh-max-members",
      featureKey: "max_members",
      value: "-1",
      appId: "runa",
      source: "self-hosted",
      validFrom: "2020-01-01T00:00:00Z",
      validUntil: null,
    },
  ],
};

interface EntitlementsResponse {
  billingAccountId: string;
  entityType: string;
  entityId: string;
  entitlementVersion: number;
  entitlements: Array<{
    id: string;
    appId: string;
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
      console.error(
        `[Entitlements] Circuit breaker OPEN after ${this.failures} failures`,
      );
    }
  }
}

const circuitBreaker = new EntitlementsCircuitBreaker();

/**
 * Get all entitlements for an entity.
 *
 * Returns a result object to distinguish between:
 * - success: entitlements found
 * - not_found: entity has no entitlements (404)
 * - unavailable: service error (caller decides how to handle)
 */
export async function getEntitlements(
  entityType: string,
  entityId: string,
  appId: string,
): Promise<EntitlementsResult> {
  // Self-hosted mode: return unlimited entitlements, no Aether dependency
  if (isSelfHosted) {
    return { status: "success", data: SELF_HOSTED_ENTITLEMENTS };
  }

  if (!BILLING_BASE_URL) {
    return {
      status: "unavailable",
      error: "BILLING_BASE_URL not configured",
    };
  }

  if (!BILLING_SERVICE_API_KEY) {
    return {
      status: "unavailable",
      error: "BILLING_SERVICE_API_KEY not configured",
    };
  }


  if (circuitBreaker.isOpen()) {
    return { status: "unavailable", error: "Circuit breaker open" };
  }

  try {
    const url = new URL(
      `${BILLING_BASE_URL}/entitlements/${appId}/${entityType}/${entityId}`,
    );

    const res = await fetch(url, {
      headers: {
        "x-service-api-key": BILLING_SERVICE_API_KEY ?? "",
      },
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
