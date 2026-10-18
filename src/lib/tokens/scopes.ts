/**
 * Canonical scope vocabulary for workspace API tokens, plus a default-deny
 * permission check. Scopes are `resource:action` strings granted to a token and
 * are the contract a future auth path enforces per operation: a token may run an
 * operation only if its granted scopes include the operation's required scope.
 *
 * This module is the pure, headless-testable half of scope enforcement. Wiring
 * token acceptance into the auth path + mapping every operation to its required
 * scope is the auth-critical slice that must be verified against the live authed
 * stack + Warden (see plans/2026-10-14-runa-api-token-acceptance.md); nothing
 * here grants access on its own.
 */

/** Every scope a token may be granted. `read` returns data; `write` mutates. */
export const API_SCOPES = [
  "task:read",
  "task:write",
  "project:read",
  "project:write",
  "comment:write",
  "label:write",
  "webhook:manage",
] as const;

/** @knipignore staged public API for the auth-acceptance slice (operation->scope map) */
export type ApiScope = (typeof API_SCOPES)[number];

const API_SCOPE_SET: ReadonlySet<string> = new Set(API_SCOPES);

/** Whether a string is a known scope. */
export const isValidScope = (scope: string): scope is ApiScope =>
  API_SCOPE_SET.has(scope);

/**
 * Validate a requested scope list, returning the invalid entries (empty when
 * all are known). An empty grant is valid (a token that can do nothing).
 */
export const invalidScopes = (scopes: readonly string[]): string[] =>
  scopes.filter((scope) => !isValidScope(scope));

/**
 * Whether a token's granted scopes permit an operation needing `required`.
 * Default-deny: only an explicit grant passes, so an operation with no mapped
 * scope (required resolves to null/undefined) is never permitted.
 */
export const tokenScopePermits = (
  granted: readonly string[],
  required: ApiScope | null | undefined,
): boolean => (required ? granted.includes(required) : false);

/**
 * The scope an API operation (GraphQL root field) requires, keyed by the
 * Postgraphile/custom field name. DEFAULT-DENY: a field absent from this map
 * returns null and is therefore never permitted for a token, so a newly added
 * operation is closed to tokens until it is deliberately mapped here. Only the
 * operations a third-party integration should reach are listed; account/token
 * administration (createApiToken, user/settings mutations, etc.) is
 * intentionally unmapped so a token can never manage identity or other tokens.
 *
 * This is the data half of per-operation enforcement; the auth path consults it
 * once token acceptance is wired (see the plan). The exact field set is derived
 * from the current schema and should be reviewed against it when wiring.
 */
const OPERATION_SCOPES: Record<string, ApiScope> = {
  // reads
  tasks: "task:read",
  task: "task:read",
  posts: "task:read",
  projects: "project:read",
  project: "project:read",
  labels: "project:read",
  // task writes
  createTask: "task:write",
  updateTask: "task:write",
  updateTaskById: "task:write",
  deleteTask: "task:write",
  deleteTaskById: "task:write",
  moveTask: "task:write",
  // project writes
  createProject: "project:write",
  updateProject: "project:write",
  updateProjectById: "project:write",
  deleteProject: "project:write",
  deleteProjectById: "project:write",
  // comment (post) writes
  createPost: "comment:write",
  updatePost: "comment:write",
  updatePostById: "comment:write",
  deletePost: "comment:write",
  deletePostById: "comment:write",
  // label writes
  createLabel: "label:write",
  updateLabel: "label:write",
  updateLabelById: "label:write",
  deleteLabel: "label:write",
  deleteLabelById: "label:write",
  createTaskLabel: "label:write",
  deleteTaskLabel: "label:write",
  deleteTaskLabelById: "label:write",
  // webhook management
  webhookEndpoints: "webhook:manage",
  createWebhookEndpoint: "webhook:manage",
  rotateWebhookEndpointSecret: "webhook:manage",
  setWebhookEndpointEnabled: "webhook:manage",
  deleteWebhookEndpoint: "webhook:manage",
};

/** The scope an operation requires, or null if it is closed to tokens. */
export const requiredScopeForOperation = (field: string): ApiScope | null =>
  OPERATION_SCOPES[field] ?? null;

/**
 * Whether a token's granted scopes permit a given operation. Default-deny: an
 * unmapped operation is denied even to a token holding every scope.
 */
export const operationPermittedByScopes = (
  field: string,
  granted: readonly string[],
): boolean => tokenScopePermits(granted, requiredScopeForOperation(field));
