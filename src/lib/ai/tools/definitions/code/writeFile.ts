/**
 * Write file tool definition.
 *
 * Writes content to a file in the sandbox.
 * Uses base64 encoding to avoid shell escaping issues.
 */

import { execInSandbox } from "lib/docker/sandbox";
import { sanitizePath } from "./util";

import type { ExecutionToolContext } from "../../core/executionContext";
import type { WriteFileInput } from "../../core/schemas";

export const WRITE_FILE_DESCRIPTION =
  "Write content to a file in the repository. Creates the file if it doesn't exist, or overwrites if it does. Creates parent directories as needed.";

export async function executeWriteFile(
  input: WriteFileInput,
  ctx: ExecutionToolContext,
): Promise<{ path: string; bytesWritten: number }> {
  const safePath = sanitizePath(input.path);
  const encoded = Buffer.from(input.content).toString("base64");

  // Create parent directories and write file using base64 decode
  const result = await execInSandbox(ctx.containerId, [
    "bash",
    "-c",
    `mkdir -p "$(dirname "${safePath}")" && echo "${encoded}" | base64 -d > "${safePath}"`,
  ]);

  if (result.exitCode !== 0) {
    throw new Error(`Failed to write file: ${result.stderr.trim()}`);
  }

  return {
    path: safePath,
    bytesWritten: Buffer.byteLength(input.content),
  };
}
