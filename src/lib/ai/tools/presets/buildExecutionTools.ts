/**
 * Preset for task execution agents.
 *
 * Combines board tools (query + write) with code execution tools
 * for autonomous task completion. Runs in a trusted admin context.
 *
 * Includes: query tools, write tools (comments/status), code tools
 * Excludes: destructive tools (agent cannot delete tasks), delegation tool
 */

import { markdownToHtml } from "../core/markdown";
import { createCodeTools } from "../factories/createCodeTools";
import { createQueryTools } from "../factories/createQueryTools";
import { createWriteTools } from "../factories/createWriteTools";

import type { ExecutionToolContext } from "../core/executionContext";

/**
 * Build tools for task execution agents.
 *
 * These agents run autonomously in Docker containers making code changes.
 * Board tools let them read task context and post progress comments.
 * Code tools let them explore, edit, and commit code changes.
 *
 * Permission checks are skipped since execution is admin-triggered.
 */
export function buildExecutionTools(ctx: ExecutionToolContext) {
  return {
    ...createQueryTools(ctx),
    ...createWriteTools(ctx, {
      skipPermissionCheck: true,
      enableActivityLogging: true,
      markdownToHtml,
    }),
    ...createCodeTools(ctx),
  };
}
