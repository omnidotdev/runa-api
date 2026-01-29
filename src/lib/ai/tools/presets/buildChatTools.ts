/**
 * Preset for chat endpoint (full tool set).
 *
 * The chat endpoint provides the complete tool set including
 * query, write, destructive, and delegation tools.
 *
 * Permission checks are enforced and approval gates are
 * configurable via agent config.
 */

import { markdownToHtml } from "../core/markdown";
import { createDelegationTool } from "../factories/createDelegationTool";
import { createDestructiveTools } from "../factories/createDestructiveTools";
import { createQueryTools } from "../factories/createQueryTools";
import { createWriteTools } from "../factories/createWriteTools";

import type { WriteToolContext } from "../core/context";
import type { DelegationContext } from "../factories/createDelegationTool";
import type { ChatToolsConfig } from "../types";

/**
 * Build the full tool set for the chat endpoint.
 *
 * Includes all tool categories:
 * - Query tools (read-only, no permissions needed)
 * - Write tools (permission-gated)
 * - Destructive tools (permission-gated, optionally approval-gated)
 * - Delegation tool (if not at max depth)
 */
export function buildChatTools(
  ctx: WriteToolContext,
  config: ChatToolsConfig,
  delegationContext?: DelegationContext,
) {
  const delegationTool = delegationContext
    ? createDelegationTool(delegationContext)
    : null;

  return {
    ...createQueryTools(ctx),
    ...createWriteTools(ctx, {
      skipPermissionCheck: false,
      enableActivityLogging: true,
      createTaskNeedsApproval: config.requireApprovalForCreate,
      markdownToHtml,
    }),
    ...createDestructiveTools(ctx, {
      requireApproval: config.requireApprovalForDestructive,
    }),
    ...(delegationTool ? { delegateToAgent: delegationTool } : {}),
  };
}
