/**
 * AI Agent Tools - Public API
 *
 * This module provides a clean, deduplicated architecture for AI agent tools.
 *
 * ## Architecture
 *
 * - **Core**: Shared types, schemas, and helper functions
 * - **Definitions**: Pure execute functions for each tool
 * - **Wrappers**: HOFs for permission checking and activity logging
 * - **Factories**: Compose definitions + wrappers into Vercel AI SDK tools
 * - **Presets**: Pre-configured tool sets for specific contexts
 *
 * ## Usage
 *
 * For most use cases, use the presets:
 *
 * ```ts
 * // Chat endpoint (full tool set)
 * const tools = buildChatTools(ctx, config, delegationContext);
 *
 * // Trigger-based agents (mention, webhook, scheduler)
 * const tools = buildTriggerTools(ctx);
 * ```
 */

// Presets (primary API)
export { buildChatTools, buildTriggerTools } from "./presets";
// Wrappers (logActivity used by projectCreation endpoint)
export { logActivity } from "./wrappers";

// Core types
export type { WriteToolContext } from "./core";
// Factories (DelegationContext type needed by chat endpoint)
export type { DelegationContext } from "./factories";
