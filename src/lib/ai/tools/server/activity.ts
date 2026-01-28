/**
 * Activity logging utility for AI agent write tools.
 *
 * Inserts audit records into the agent_activity table.
 * Fire-and-forget: errors are logged to console, never thrown.
 * This ensures tool execution is never blocked by logging failures.
 */

import { dbPool } from "lib/db/db";
import { agentActivities } from "lib/db/schema";

import { requireProjectPermission } from "./permissions";

import type { WriteToolContext } from "./context";
import type { PermissionLevel } from "./permissions";

interface LogActivityParams {
  context: WriteToolContext;
  toolName: string;
  toolInput: unknown;
  toolOutput?: unknown;
  status: "completed" | "failed" | "denied";
  errorMessage?: string;
  affectedTaskIds?: string[];
  requiresApproval?: boolean;
  approvalStatus?: string;
  /** Entity state before the write, for undo/rollback support. */
  snapshotBefore?: unknown;
}

/**
 * Log a tool execution to the agent_activity audit table.
 *
 * Fire-and-forget — the returned promise should NOT be awaited
 * in the tool's critical path. Errors are caught and logged.
 */
export function logActivity(params: LogActivityParams): void {
  dbPool
    .insert(agentActivities)
    .values({
      organizationId: params.context.organizationId,
      projectId: params.context.projectId,
      sessionId: params.context.sessionId,
      userId: params.context.userId,
      toolName: params.toolName,
      toolInput: params.toolInput,
      toolOutput: params.toolOutput ?? null,
      requiresApproval: params.requiresApproval ?? false,
      approvalStatus: params.approvalStatus ?? null,
      status: params.status,
      errorMessage: params.errorMessage ?? null,
      affectedTaskIds: params.affectedTaskIds ?? [],
      snapshotBefore: params.snapshotBefore ?? null,
    })
    // biome-ignore lint/suspicious/noConsole: fire-and-forget audit logging
    .catch((err) => console.error("[AI] Failed to log activity:", err));
}

interface WithPermissionAndLoggingOptions {
  toolName: string;
  context: WriteToolContext;
  permissionLevel: PermissionLevel;
  needsApproval?: boolean;
}

/**
 * Higher-order function that wraps tool execution with permission checking
 * and activity logging.
 *
 * Pattern:
 *  1. Check permission → log "denied" on failure, throw
 *  2. Execute `fn(input)` → log "completed" on success
 *  3. Catch errors → log "failed", re-throw
 *
 * Returns the result of `fn` and a list of affected task IDs for logging.
 */
export async function withPermissionAndLogging<TInput, TResult extends { affectedIds?: string[] }>(
  options: WithPermissionAndLoggingOptions,
  input: TInput,
  fn: (input: TInput) => Promise<TResult>,
): Promise<TResult> {
  const { toolName, context, permissionLevel, needsApproval } = options;

  try {
    await requireProjectPermission(context, permissionLevel);
  } catch (err) {
    logActivity({
      context,
      toolName,
      toolInput: input,
      status: "denied",
      requiresApproval: needsApproval,
      errorMessage: err instanceof Error ? err.message : "Permission denied",
    });
    throw err;
  }

  try {
    const result = await fn(input);

    logActivity({
      context,
      toolName,
      toolInput: input,
      toolOutput: result,
      status: "completed",
      requiresApproval: needsApproval,
      affectedTaskIds: result.affectedIds,
    });

    return result;
  } catch (err) {
    logActivity({
      context,
      toolName,
      toolInput: input,
      status: "failed",
      requiresApproval: needsApproval,
      errorMessage: err instanceof Error ? err.message : "Unknown error",
    });
    throw err;
  }
}
