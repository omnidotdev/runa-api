/**
 * Tool registry - single source of truth for tool metadata.
 *
 * This registry defines metadata for all AI tools, enabling the frontend
 * to correctly classify and render tools without hardcoded name lists.
 *
 * Categories:
 * - query: Read-only operations (no cache invalidation needed)
 * - write: Create/update operations (triggers cache invalidation)
 * - destructive: Delete operations (triggers cache invalidation, red styling)
 * - delegation: Agent-to-agent handoff (special rendering)
 * - projectCreation: Project creation flow (special handling)
 *
 * Consolidated tool set (7 tools + query/delegation):
 * - Task: createTasks, updateTasks, deleteTasks
 * - Column: createColumns, updateColumns, deleteColumns
 * - Comment: createComments
 */

/** Tool category for classification. */
export type ToolCategory =
  | "query"
  | "write"
  | "destructive"
  | "delegation"
  | "projectCreation";

/** Entity type the tool operates on. */
export type ToolEntity = "task" | "column" | "label" | "comment" | "project";

/** Metadata for a single tool. */
export interface ToolMetadata {
  /** Tool category for UI styling and cache invalidation. */
  category: ToolCategory;
  /** Entity type for grouping related tools. */
  entity: ToolEntity | null;
}

/**
 * Registry of all tool metadata.
 *
 * When adding new tools:
 * 1. Add the tool name as a key
 * 2. Specify category and entity
 * 3. Frontend will automatically pick up the metadata
 */
export const toolRegistry = {
  // Query tools (read-only)
  getTask: { category: "query", entity: "task" },
  queryTasks: { category: "query", entity: "task" },
  queryProject: { category: "query", entity: "project" },

  // Write tools - Task
  createTasks: { category: "write", entity: "task" },
  updateTasks: { category: "write", entity: "task" },

  // Write tools - Column
  createColumns: { category: "write", entity: "column" },
  updateColumns: { category: "write", entity: "column" },

  // Write tools - Comment
  createComments: { category: "write", entity: "comment" },

  // Destructive tools
  deleteTasks: { category: "destructive", entity: "task" },
  deleteColumns: { category: "destructive", entity: "column" },

  // Delegation tools
  delegateToAgent: { category: "delegation", entity: null },

  // Project creation tools
  proposeProject: { category: "projectCreation", entity: "project" },
  createProjectFromProposal: { category: "projectCreation", entity: "project" },
} as const satisfies Record<string, ToolMetadata>;
