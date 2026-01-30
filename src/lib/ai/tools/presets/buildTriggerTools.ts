/**
 * Preset for trigger-based agents (mention, webhook, scheduler).
 *
 * Triggers run in a trusted server context where the user has already
 * been authenticated, so permission checks are skipped.
 *
 * Includes: query + write tools
 * Excludes: destructive tools (triggers shouldn't delete data)
 */

import { markdownToHtml } from "../core/markdown";
import { createQueryTools } from "../factories/createQueryTools";
import { createWriteTools } from "../factories/createWriteTools";

import type { WriteToolContext } from "../core/context";

/**
 * Build tools for trigger-based agents.
 *
 * These agents are invoked by system events (mentions, webhooks, schedules)
 * where the triggering user has already been authenticated. Permission
 * checks are skipped since the context is trusted.
 */
export function buildTriggerTools(ctx: WriteToolContext) {
  return {
    ...createQueryTools(ctx),
    ...createWriteTools(ctx, {
      skipPermissionCheck: true,
      enableActivityLogging: true,
      markdownToHtml,
    }),
  };
}
