/**
 * Shared type definitions for Elysia auth guards.
 */

import type { AuthenticatedUser, OrganizationClaim } from "../auth";

/**
 * Authentication context added by authGuard.
 * Contains the authenticated user and their organization claims.
 */
export interface AuthContext {
  user: AuthenticatedUser["user"];
  organizations: OrganizationClaim[];
  accessToken: string;
}
