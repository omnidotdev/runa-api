import { QueryClient } from "@tanstack/query-core";
import { eq } from "drizzle-orm";
import { jwtVerify } from "jose";
import ms from "ms";

import { AUTH_BASE_URL, isSelfHosted } from "lib/config/env.config";
import { dbPool } from "lib/db/db";
import { projects, users } from "lib/db/schema";

import type { JWTPayload } from "jose";
import type { SelectUser } from "lib/db/schema";

/** Claim key for organization claims in JWT. */
const OMNI_CLAIMS_ORGANIZATIONS =
  "https://manifold.omni.dev/@omni/claims/organizations";

interface UserInfoClaims extends JWTPayload {
  sub: string;
  name?: string;
  preferred_username?: string;
  picture?: string;
  email?: string;
  [key: string]: unknown;
}

/** Roles that can create projects within an organization. */
const PROJECT_CREATION_ROLES = new Set(["editor", "admin", "owner"]);

/** Roles that have admin privileges within an organization. */
const ADMIN_ROLES = new Set(["admin", "owner"]);

/**
 * Organization claim from JWT.
 */
export interface OrganizationClaim {
  id: string;
  slug: string;
  type: "personal" | "team";
  roles: string[];
}

/**
 * Resolved identity from a Bearer token.
 */
export interface AuthenticatedUser {
  user: SelectUser;
  organizations: OrganizationClaim[];
  accessToken: string;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      staleTime: ms("2m"),
    },
  },
});

/**
 * Get symmetric key for self-hosted JWT verification.
 */
async function getSelfHostedKey(): Promise<Uint8Array> {
  const { AUTH_SECRET } = process.env;
  if (!AUTH_SECRET) {
    throw new Error("AUTH_SECRET not configured");
  }

  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(AUTH_SECRET),
    "HKDF",
    false,
    ["deriveBits"],
  );

  return new Uint8Array(
    await crypto.subtle.deriveBits(
      {
        name: "HKDF",
        hash: "SHA-256",
        salt: encoder.encode("runa-self-hosted-auth"),
        info: encoder.encode("jwt-signing-key"),
      },
      keyMaterial,
      256,
    ),
  );
}

/**
 * Authenticate a request by extracting and validating the Bearer token.
 * Returns the authenticated user and their organization claims.
 */
export async function authenticateRequest(
  request: Request,
): Promise<AuthenticatedUser> {
  const accessToken = request.headers.get("authorization")?.split("Bearer ")[1];

  if (!accessToken) {
    throw new Error("Missing or invalid authorization header");
  }

  let claims: UserInfoClaims;

  if (isSelfHosted) {
    const key = await getSelfHostedKey();
    const { payload } = await jwtVerify(accessToken, key, {
      issuer: "self-hosted",
    });
    claims = payload as UserInfoClaims;
  } else {
    // SaaS mode: validate via userinfo endpoint
    claims = await queryClient.ensureQueryData({
      queryKey: ["AI:UserInfo", { accessToken }],
      queryFn: async () => {
        const response = await fetch(`${AUTH_BASE_URL}/oauth2/userinfo`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!response.ok) {
          throw new Error("Invalid access token");
        }
        return (await response.json()) as UserInfoClaims;
      },
    });
  }

  if (!claims.sub || !claims.email) {
    throw new Error("Missing required claims (sub, email)");
  }

  // Find the user in the database
  const user = await dbPool.query.users.findFirst({
    where: eq(users.identityProviderId, claims.sub),
  });

  if (!user) {
    throw new Error("User not found");
  }

  const organizations =
    (claims[OMNI_CLAIMS_ORGANIZATIONS] as OrganizationClaim[]) ?? [];

  return { user, organizations, accessToken };
}

// ─────────────────────────────────────────────
// Result-based Authorization Helpers
// ─────────────────────────────────────────────

/**
 * Standard error response shape for authorization failures.
 */
interface AuthErrorResponse {
  error: string;
}

/**
 * Discriminated union for authorization check results.
 * Enables type-safe early returns without try/catch boilerplate.
 */
export type AuthResult<T> =
  | { ok: true; value: T }
  | { ok: false; status: 403; response: AuthErrorResponse };

/**
 * Async authorization result for functions that need database access.
 */
export type AsyncAuthResult<T> = Promise<
  | { ok: true; value: T }
  | { ok: false; status: 403 | 404; response: AuthErrorResponse }
>;

/**
 * Check if user is a member of the specified organization.
 * Returns a result object instead of throwing.
 *
 * @example
 * const result = checkOrgMember(auth.organizations, query.organizationId);
 * if (!result.ok) { set.status = result.status; return result.response; }
 * // result.value is now the OrganizationClaim
 */
export function checkOrgMember(
  organizations: OrganizationClaim[],
  organizationId: string,
): AuthResult<OrganizationClaim> {
  const orgClaim = organizations.find((org) => org.id === organizationId);

  if (!orgClaim) {
    return {
      ok: false,
      status: 403,
      response: { error: "Access denied to this organization" },
    };
  }

  return { ok: true, value: orgClaim };
}

/**
 * Check if user is an admin/owner of the specified organization.
 * Returns a result object instead of throwing.
 *
 * @example
 * const result = checkOrgAdmin(auth.organizations, body.organizationId, "manage personas");
 * if (!result.ok) { set.status = result.status; return result.response; }
 */
export function checkOrgAdmin(
  organizations: OrganizationClaim[],
  organizationId: string,
  action = "perform this action",
): AuthResult<OrganizationClaim> {
  const orgClaim = organizations.find((org) => org.id === organizationId);

  if (!orgClaim) {
    return {
      ok: false,
      status: 403,
      response: { error: "Access denied to this organization" },
    };
  }

  const isAdmin = orgClaim.roles.some((role) => ADMIN_ROLES.has(role));

  if (!isAdmin) {
    return {
      ok: false,
      status: 403,
      response: { error: `Only organization admins can ${action}` },
    };
  }

  return { ok: true, value: orgClaim };
}

/**
 * Check if user has access to a project via organization membership.
 * Returns a result object instead of throwing.
 *
 * @example
 * const result = await checkProjectAccess(query.projectId, auth.organizations);
 * if (!result.ok) { set.status = result.status; return result.response; }
 */
export async function checkProjectAccess(
  projectId: string,
  organizations: OrganizationClaim[],
): AsyncAuthResult<{ organizationId: string }> {
  const project = await dbPool.query.projects.findFirst({
    where: eq(projects.id, projectId),
    columns: { organizationId: true },
  });

  if (!project) {
    return {
      ok: false,
      status: 404,
      response: { error: "Project not found" },
    };
  }

  const hasAccess = organizations.some(
    (org) => org.id === project.organizationId,
  );

  if (!hasAccess) {
    return {
      ok: false,
      status: 403,
      response: {
        error: "Access denied: user is not a member of this organization",
      },
    };
  }

  return { ok: true, value: { organizationId: project.organizationId } };
}

/**
 * Check if user has project access AND admin role in the project's organization.
 * Combines checkProjectAccess and checkOrgAdmin into a single call.
 *
 * @example
 * const result = await checkProjectAdmin(body.projectId, auth.organizations, "manage webhooks");
 * if (!result.ok) { set.status = result.status; return result.response; }
 * // result.value contains both organizationId and orgClaim
 */
export async function checkProjectAdmin(
  projectId: string,
  organizations: OrganizationClaim[],
  action = "perform this action",
): AsyncAuthResult<{ organizationId: string; orgClaim: OrganizationClaim }> {
  const projectResult = await checkProjectAccess(projectId, organizations);
  if (!projectResult.ok) return projectResult;

  const adminResult = checkOrgAdmin(
    organizations,
    projectResult.value.organizationId,
    action,
  );
  if (!adminResult.ok) return adminResult;

  return {
    ok: true,
    value: {
      organizationId: projectResult.value.organizationId,
      orgClaim: adminResult.value,
    },
  };
}

/**
 * Check if user has organization-level access for project creation.
 * Returns a result object instead of throwing.
 */
export async function checkOrganizationAccess(
  organizationId: string,
  organizations: OrganizationClaim[],
): AsyncAuthResult<{
  organizationId: string;
  organizationSlug: string;
  roles: string[];
}> {
  const orgClaim = organizations.find((org) => org.id === organizationId);

  if (!orgClaim) {
    return {
      ok: false,
      status: 403,
      response: {
        error: "Access denied: user is not a member of this organization",
      },
    };
  }

  const canCreateProjects = orgClaim.roles.some((role) =>
    PROJECT_CREATION_ROLES.has(role),
  );

  if (!canCreateProjects) {
    return {
      ok: false,
      status: 403,
      response: {
        error:
          "Access denied: insufficient permissions to create projects. Requires editor, admin, or owner role.",
      },
    };
  }

  return {
    ok: true,
    value: {
      organizationId,
      organizationSlug: orgClaim.slug,
      roles: orgClaim.roles,
    },
  };
}
