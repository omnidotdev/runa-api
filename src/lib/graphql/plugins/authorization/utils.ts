/**
 * Shared authorization utilities for RBAC enforcement.
 */

import { hasMinRole, isAdminOrOwner } from "./permissions";

import type { Role } from "./permissions";
import type { dbPool } from "lib/db/db";

type DbType = typeof dbPool;

/**
 * Assert that the user is authenticated.
 * Throws error if `observer` is null.
 */
export const assertAuthenticated = (observer: unknown): void => {
  if (!observer) throw new Error("Unauthorized");
};

/**
 * Assert that the user meets the minimum required role.
 * Throws error if role is insufficient.
 */
export const assertMinRole = (userRole: Role, minRole: Role): void => {
  if (!hasMinRole(userRole, minRole)) throw new Error("Unauthorized");
};

/**
 * Assert that the user is admin or owner.
 * Throws error if user is a member.
 */
export const assertAdminOrOwner = (role: Role): void => {
  if (!isAdminOrOwner(role)) throw new Error("Unauthorized");
};

/**
 * Assert that the target is not an owner.
 * Used to prevent modifications to owner roles/membership.
 * Throws "Cannot modify owner" if target is owner.
 */
export const assertNotTargetingOwner = (targetRole: Role): void => {
  if (targetRole === "owner") throw new Error("Cannot modify owner");
};

/**
 * Assert that the user is the resource owner (self-only operations).
 * Throws error if user is not the owner.
 */
export const assertSelfOnly = (
  observerId: string,
  resourceOwnerId: string,
): void => {
  if (observerId !== resourceOwnerId) throw new Error("Unauthorized");
};

/**
 * Get workspace membership for a user.
 * Returns the user's role and workspace data if they are a member.
 * Throws error if user is not a member.
 */
export const getWorkspaceMembership = async (
  db: DbType,
  workspaceId: string,
  userId: string,
) => {
  const workspace = await db.query.workspaceTable.findFirst({
    where: (table, { eq }) => eq(table.id, workspaceId),
    with: {
      workspaceUsers: {
        where: (table, { eq }) => eq(table.userId, userId),
      },
    },
  });

  if (!workspace?.workspaceUsers?.length) throw new Error("Unauthorized");

  return {
    role: workspace.workspaceUsers[0].role as Role,
    workspace,
  };
};

/**
 * Assert workspace membership and return role.
 * Combines membership check with role extraction.
 */
export const assertWorkspaceMembership = async (
  db: DbType,
  workspaceId: string,
  userId: string,
): Promise<Role> => {
  const { role } = await getWorkspaceMembership(db, workspaceId, userId);

  return role;
};

/**
 * Assert workspace membership with minimum role requirement.
 */
export const assertWorkspaceMembershipWithRole = async (
  db: DbType,
  workspaceId: string,
  userId: string,
  minRole: Role,
): Promise<Role> => {
  const role = await assertWorkspaceMembership(db, workspaceId, userId);

  assertMinRole(role, minRole);

  return role;
};

/**
 * Check if user is the author of a resource or has admin+ role.
 * Used for resources where authors can modify their own items.
 */
export const canModifyAsAuthorOrAdmin = (
  observerId: string,
  authorId: string,
  role: Role,
): boolean => observerId === authorId || isAdminOrOwner(role);

/**
 * Assert that user can modify a resource (author or admin+).
 */
export const assertAuthorOrAdmin = (
  observerId: string,
  authorId: string,
  role: Role,
): void => {
  if (!canModifyAsAuthorOrAdmin(observerId, authorId, role))
    throw new Error("Unauthorized");
};
