/**
 * Read file tool definition.
 *
 * Reads file contents from the sandbox container with line numbers.
 * Path is sanitized to prevent directory traversal.
 */

import { execInSandbox } from "lib/docker/sandbox";
import { sanitizePath } from "./util";

import type { ExecutionToolContext } from "../../core/executionContext";
import type { ReadFileInput } from "../../core/schemas";

export const READ_FILE_DESCRIPTION =
  "Read the contents of a file in the repository. Returns file content with line numbers.";

export async function executeReadFile(
  input: ReadFileInput,
  ctx: ExecutionToolContext,
): Promise<{ content: string; lineCount: number }> {
  const safePath = sanitizePath(input.path);
  const { startLine, maxLines } = input;

  let command: string[];

  if (startLine) {
    command = [
      "bash",
      "-c",
      `sed -n '${startLine},${startLine + maxLines - 1}p' "${safePath}" | cat -n`,
    ];
  } else {
    command = ["bash", "-c", `head -n ${maxLines} "${safePath}" | cat -n`];
  }

  const result = await execInSandbox(ctx.containerId, command);

  if (result.exitCode !== 0) {
    throw new Error(`Failed to read file: ${result.stderr.trim()}`);
  }

  const lines = result.stdout.split("\n").filter((l) => l.length > 0);

  return {
    content: result.stdout,
    lineCount: lines.length,
  };
}
