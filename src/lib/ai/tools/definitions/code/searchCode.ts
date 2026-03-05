/**
 * Search code tool definition.
 *
 * Searches for patterns in repository files using grep.
 * Supports regex patterns and glob-based file filtering.
 */

import { execInSandbox } from "lib/docker/sandbox";

import type { ExecutionToolContext } from "../../core/executionContext";
import type { SearchCodeInput } from "../../core/schemas";

export const SEARCH_CODE_DESCRIPTION =
  "Search for a pattern in the repository code. Returns matching lines with file paths and line numbers. Supports regex patterns and file glob filters.";

export async function executeSearchCode(
  input: SearchCodeInput,
  ctx: ExecutionToolContext,
): Promise<{ matches: string; matchCount: number }> {
  const globArg = input.glob ? `--include='${input.glob}'` : "";

  const result = await execInSandbox(ctx.containerId, [
    "bash",
    "-c",
    `grep -rn ${globArg} --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=dist -E '${input.pattern.replace(/'/g, "'\\''")}' . | head -${input.maxResults}`,
  ]);

  // grep returns exit code 1 when no matches found — not an error
  if (result.exitCode !== 0 && result.exitCode !== 1) {
    throw new Error(`Search failed: ${result.stderr.trim()}`);
  }

  const matches = result.stdout.trim();
  const matchCount = matches ? matches.split("\n").length : 0;

  return { matches, matchCount };
}
