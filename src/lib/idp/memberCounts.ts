/**
 * IDP member count helper.
 *
 * Fetch organization member counts from the IDP API.
 * SECURITY: Fails OPEN — if we cannot reach the IDP, allow the action
 * to avoid blocking legitimate membership changes.
 */

import { AUTH_BASE_URL } from "lib/config/env.config";

/** Request timeout in milliseconds */
const REQUEST_TIMEOUT_MS = 5000;

/** Shape returned by the IDP members endpoint */
interface IdpMember {
  userId: string;
  role: "owner" | "admin" | "member";
}

/** Aggregated member counts for an organization */
interface MemberCounts {
  totalMembers: number;
  totalAdmins: number;
}

/**
 * Fetch member counts for an organization from the IDP API.
 *
 * Calls `GET ${AUTH_BASE_URL}/api/organization/${orgId}/members` and
 * aggregates the results. Owners are counted as admins.
 *
 * @param orgId - Organization ID to query
 * @returns Member counts, or null if the IDP is unreachable (fail open)
 */
async function fetchMemberCounts(orgId: string): Promise<MemberCounts | null> {
  if (!AUTH_BASE_URL) {
    console.warn("[IDP] AUTH_BASE_URL not configured, failing open");
    return null;
  }

  try {
    const response = await fetch(
      `${AUTH_BASE_URL}/api/organization/${orgId}/members`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      },
    );

    if (!response.ok) {
      console.warn(
        `[IDP] Failed to fetch members for org ${orgId}: HTTP ${response.status}`,
      );
      return null;
    }

    const members = (await response.json()) as IdpMember[];

    const totalMembers = members.length;
    const totalAdmins = members.filter(
      (m) => m.role === "admin" || m.role === "owner",
    ).length;

    return { totalMembers, totalAdmins };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn(`[IDP] Error fetching members for org ${orgId}: ${message}`);
    return null;
  }
}

export default fetchMemberCounts;
