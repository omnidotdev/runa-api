/**
 * Tool context types for AI agent tool execution.
 *
 * ToolContext provides read-only project scoping.
 * WriteToolContext extends it with auth credentials needed
 * for permission checks and activity logging.
 */

/** Context for read-only tools (query tools). */
export interface ToolContext {
  projectId: string;
  organizationId: string;
}

/** Extended context for write tools that require authorization. */
export interface WriteToolContext extends ToolContext {
  userId: string;
  accessToken: string;
  sessionId: string;
}
