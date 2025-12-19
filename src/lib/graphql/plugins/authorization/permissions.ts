/**
 * Centralized permission definitions for RBAC.
 *
 * Permission naming convention: `resource:action`
 */

// role hierarchy for permission checks
export const RoleHierarchy = {
  owner: 3,
  admin: 2,
  member: 1,
} as const;

export type Role = keyof typeof RoleHierarchy;

/**
 * Check if a role meets the minimum required role level.
 * Uses numeric hierarchy: owner (3) > admin (2) > member (1)
 */
export const hasMinRole = (userRole: Role, minRole: Role): boolean =>
  RoleHierarchy[userRole] >= RoleHierarchy[minRole];

/**
 * Check if user has admin or owner role.
 */
export const isAdminOrOwner = (role: Role): boolean =>
  role === "admin" || role === "owner";

/**
 * Check if user is the workspace owner.
 */
export const isOwner = (role: Role): boolean => role === "owner";

/**
 * Permission definitions for all resources.
 * Format: RESOURCE_ACTION for use as constants.
 *
 * These can be used directly or mapped to policy engine rules later.
 */
export const Permission = {
  // Workspace
  WORKSPACE_CREATE: "workspace:create",
  WORKSPACE_READ: "workspace:read",
  WORKSPACE_UPDATE: "workspace:update",
  WORKSPACE_DELETE: "workspace:delete",

  // WorkspaceUser (team management)
  WORKSPACE_USER_CREATE: "workspace_user:create",
  WORKSPACE_USER_READ: "workspace_user:read",
  WORKSPACE_USER_UPDATE: "workspace_user:update",
  WORKSPACE_USER_DELETE: "workspace_user:delete",

  // Invitation
  INVITATION_CREATE: "invitation:create",
  INVITATION_READ: "invitation:read",
  INVITATION_UPDATE: "invitation:update",
  INVITATION_DELETE: "invitation:delete",

  // Project
  PROJECT_CREATE: "project:create",
  PROJECT_READ: "project:read",
  PROJECT_UPDATE: "project:update",
  PROJECT_DELETE: "project:delete",

  // ProjectColumn
  PROJECT_COLUMN_CREATE: "project_column:create",
  PROJECT_COLUMN_READ: "project_column:read",
  PROJECT_COLUMN_UPDATE: "project_column:update",
  PROJECT_COLUMN_DELETE: "project_column:delete",

  // Task
  TASK_CREATE: "task:create",
  TASK_READ: "task:read",
  TASK_UPDATE: "task:update",
  TASK_DELETE: "task:delete",

  // Column
  COLUMN_CREATE: "column:create",
  COLUMN_READ: "column:read",
  COLUMN_UPDATE: "column:update",
  COLUMN_DELETE: "column:delete",

  // Label
  LABEL_CREATE: "label:create",
  LABEL_READ: "label:read",
  LABEL_UPDATE: "label:update",
  LABEL_DELETE: "label:delete",

  // TaskLabel
  TASK_LABEL_CREATE: "task_label:create",
  TASK_LABEL_READ: "task_label:read",
  TASK_LABEL_UPDATE: "task_label:update",
  TASK_LABEL_DELETE: "task_label:delete",

  // Assignee
  ASSIGNEE_CREATE: "assignee:create",
  ASSIGNEE_READ: "assignee:read",
  ASSIGNEE_UPDATE: "assignee:update",
  ASSIGNEE_DELETE: "assignee:delete",

  // Post
  POST_CREATE: "post:create",
  POST_READ: "post:read",
  POST_UPDATE: "post:update",
  POST_DELETE: "post:delete",

  // Emoji
  EMOJI_CREATE: "emoji:create",
  EMOJI_READ: "emoji:read",
  EMOJI_UPDATE: "emoji:update",
  EMOJI_DELETE: "emoji:delete",

  // User (self-only)
  USER_READ: "user:read",
  USER_UPDATE: "user:update",
  USER_DELETE: "user:delete",

  // UserPreference (self-only)
  USER_PREFERENCE_CREATE: "user_preference:create",
  USER_PREFERENCE_READ: "user_preference:read",
  USER_PREFERENCE_UPDATE: "user_preference:update",
  USER_PREFERENCE_DELETE: "user_preference:delete",
} as const;

export type PermissionType = (typeof Permission)[keyof typeof Permission];
