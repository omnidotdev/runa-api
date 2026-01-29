/**
 * Permission check wrapper for AI agent write tools.
 *
 * Wraps the AuthZ checkPermission() call to provide clear,
 * descriptive errors when permission is denied.
 *
 * Permission mapping mirrors the PostGraphile authorization plugins:
 * - Task create/update/move: "editor"
 * - Assignee add/remove: "member"
 * - TaskLabel add/remove: "member"
 * - Comment create: "member"
 */

import { checkPermission } from "lib/authz/sync";

import type { WriteToolContext } from "../core/context";

export type PermissionLevel = "editor" | "member";

/**
 * Require a project-level permission for the current user.
 * Throws a descriptive error if the permission check fails.
 */
export async function requireProjectPermission(
  context: WriteToolContext,
  level: PermissionLevel,
): Promise<void> {
  const allowed = await checkPermission(
    context.userId,
    "project",
    context.projectId,
    level,
    context.accessToken,
  );

  if (!allowed) {
    throw new Error(
      `Permission denied: you need "${level}" access on this project to perform this action.`,
    );
  }
}
