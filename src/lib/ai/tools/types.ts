/**
 * Shared types for AI agent tools.
 */

/** Task reference - either by ID or project-scoped number. */
export interface TaskRef {
  taskId?: string;
  taskNumber?: number;
}

/** Options for creating write tools. */
export interface WriteToolsOptions {
  /** Skip permission checks (default: false). Use for trusted contexts like triggers. */
  skipPermissionCheck?: boolean;
  /** Enable activity logging (default: true). */
  enableActivityLogging?: boolean;
  /** Whether createTask needs approval (from agentConfig). */
  createTaskNeedsApproval?: boolean;
}

/** Options for creating destructive tools. */
export interface DestructiveToolsOptions {
  /** Whether destructive tools require approval (from agentConfig). */
  requireApproval?: boolean;
}

/** Configuration for chat endpoint tools. */
export interface ChatToolsConfig {
  /** Whether createTask requires approval. */
  requireApprovalForCreate: boolean;
  /** Whether destructive tools require approval. */
  requireApprovalForDestructive: boolean;
}
