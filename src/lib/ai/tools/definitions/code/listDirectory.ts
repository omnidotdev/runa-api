/**
 * List directory tool definition.
 *
 * Lists directory contents as a tree structure.
 * Excludes common non-essential directories (node_modules, .git, etc.).
 */

import { execInSandbox } from "lib/docker/sandbox";
import { sanitizePath } from "./util";

import type { ExecutionToolContext } from "../../core/executionContext";
import type { ListDirectoryInput } from "../../core/schemas";

export const LIST_DIRECTORY_DESCRIPTION =
  "List the contents of a directory as a tree structure. Excludes node_modules, .git, and other non-essential directories.";

export async function executeListDirectory(
  input: ListDirectoryInput,
  ctx: ExecutionToolContext,
): Promise<{ tree: string }> {
  const safePath = sanitizePath(input.path ?? ".");

  const result = await execInSandbox(ctx.containerId, [
    "bash",
    "-c",
    `find "${safePath}" -maxdepth ${input.maxDepth} -not -path '*/node_modules/*' -not -path '*/.git/*' -not -path '*/dist/*' -not -path '*/.next/*' | head -200 | sort`,
  ]);

  if (result.exitCode !== 0) {
    throw new Error(`Failed to list directory: ${result.stderr.trim()}`);
  }

  return { tree: result.stdout };
}
