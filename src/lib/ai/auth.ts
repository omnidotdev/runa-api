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

/**
 * Validate that a user has access to a project via their organization membership.
 */
export async function validateProjectAccess(
  projectId: string,
  organizations: OrganizationClaim[],
): Promise<{ organizationId: string }> {
  const project = await dbPool.query.projects.findFirst({
    where: eq(projects.id, projectId),
    columns: { organizationId: true },
  });

  if (!project) {
    throw new Error("Project not found");
  }

  const hasAccess = organizations.some(
    (org) => org.id === project.organizationId,
  );

  if (!hasAccess) {
    throw new Error("Access denied: user is not a member of this organization");
  }

  return { organizationId: project.organizationId };
}

/**
 * Verify the user has admin/owner role in the specified organization.
 *
 * @param organizations - User's organization claims from JWT
 * @param organizationId - Organization ID to check
 * @param action - Description of the action (for error message)
 * @returns The matching organization claim
 * @throws Error if user lacks access or admin role
 */
export function requireOrgAdmin(
  organizations: OrganizationClaim[],
  organizationId: string,
  action = "perform this action",
): OrganizationClaim {
  const orgClaim = organizations.find((org) => org.id === organizationId);

  if (!orgClaim) {
    throw new Error("Access denied to this organization");
  }

  const isAdmin = orgClaim.roles.some((role) => ADMIN_ROLES.has(role));

  if (!isAdmin) {
    throw new Error(`Only organization admins can ${action}`);
  }

  return orgClaim;
}

/**
 * Check if user has any access to the specified organization.
 *
 * @param organizations - User's organization claims from JWT
 * @param organizationId - Organization ID to check
 * @returns The matching organization claim
 * @throws Error if user is not a member
 */
export function requireOrgMember(
  organizations: OrganizationClaim[],
  organizationId: string,
): OrganizationClaim {
  const orgClaim = organizations.find((org) => org.id === organizationId);

  if (!orgClaim) {
    throw new Error("Access denied to this organization");
  }

  return orgClaim;
}

/**
 * Validate that a user has organization-level access for project creation.
 *
 * Project creation requires "editor", "admin", or "owner" role.
 * This is a higher permission level than simply viewing projects.
 */
export async function validateOrganizationAccess(
  organizationId: string,
  organizations: OrganizationClaim[],
): Promise<{
  organizationId: string;
  organizationSlug: string;
  roles: string[];
}> {
  const orgClaim = organizations.find((org) => org.id === organizationId);

  if (!orgClaim) {
    throw new Error("Access denied: user is not a member of this organization");
  }

  const canCreateProjects = orgClaim.roles.some((role) =>
    PROJECT_CREATION_ROLES.has(role),
  );

  if (!canCreateProjects) {
    throw new Error(
      "Access denied: insufficient permissions to create projects. Requires editor, admin, or owner role.",
    );
  }

  return {
    organizationId,
    organizationSlug: orgClaim.slug,
    roles: orgClaim.roles,
  };
}
