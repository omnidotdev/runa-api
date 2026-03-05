/**
 * Execution context for code tools.
 *
 * Extends WriteToolContext with sandbox and GitHub information
 * needed for code execution within Docker containers.
 */

import type { WriteToolContext } from "./context";

/** Context for code execution tools running inside a Docker sandbox. */
export interface ExecutionToolContext extends WriteToolContext {
  /** Docker container ID for the sandbox. */
  containerId: string;
  /** GitHub App installation ID for API operations. */
  installationId: number;
  /** Full repository name (e.g., "omnidotdev/runa-api"). */
  repoFullName: string;
  /** Feature branch name for this execution. */
  branchName: string;
  /** Execution record ID for status tracking. */
  executionId: string;
}
