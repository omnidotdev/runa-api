/**
 * Tool registry REST endpoint.
 *
 * GET /api/ai/tools/registry — Retrieve tool metadata registry
 *
 * This endpoint provides the frontend with tool classification metadata,
 * enabling proper UI rendering and cache invalidation without hardcoded
 * tool name lists.
 *
 * No authentication required — this is static configuration data.
 */

import { Elysia } from "elysia";

import { toolRegistry } from "./tools/registry";

import type { ToolCategory, ToolEntity, ToolMetadata } from "./tools/registry";

/** Response type for the registry endpoint. */
interface RegistryResponse {
  /** Map of tool name to metadata. */
  tools: Record<string, ToolMetadata>;
  /** Available categories for reference. */
  categories: ToolCategory[];
  /** Available entities for reference. */
  entities: (ToolEntity | null)[];
}

const registryRoutes = new Elysia({ prefix: "/api/ai/tools" }).get(
  "/registry",
  (): RegistryResponse => {
    return {
      tools: toolRegistry,
      categories: [
        "query",
        "write",
        "destructive",
        "delegation",
        "projectCreation",
      ],
      entities: ["task", "column", "label", "comment", "project", null],
    };
  },
);

export default registryRoutes;
