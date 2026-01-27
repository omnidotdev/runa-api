/**
 * Activity logging utility for AI agent write tools.
 *
 * Inserts audit records into the agent_activity table.
 * Fire-and-forget: errors are logged to console, never thrown.
 * This ensures tool execution is never blocked by logging failures.
 */

import { dbPool } from "lib/db/db";
import { agentActivities } from "lib/db/schema";

import type { WriteToolContext } from "./context";

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
    })
    // biome-ignore lint/suspicious/noConsole: fire-and-forget audit logging
    .catch((err) => console.error("[AI] Failed to log activity:", err));
}
