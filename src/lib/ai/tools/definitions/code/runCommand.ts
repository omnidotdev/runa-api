/**
 * Run command tool definition.
 *
 * Executes a shell command inside the sandbox container.
 * Timeout-enforced to prevent runaway processes.
 */

import { execInSandbox } from "lib/docker/sandbox";

import type { ExecutionToolContext } from "../../core/executionContext";
import type { RunCommandInput } from "../../core/schemas";

export const RUN_COMMAND_DESCRIPTION =
  "Execute a shell command in the repository workspace. Use for installing dependencies, running tests, building, linting, etc. Commands run with enforced timeouts.";

export async function executeRunCommand(
  input: RunCommandInput,
  ctx: ExecutionToolContext,
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  const result = await execInSandbox(
    ctx.containerId,
    ["bash", "-c", input.command],
    input.timeoutMs,
  );

  return {
    stdout: result.stdout,
    stderr: result.stderr,
    exitCode: result.exitCode,
  };
}
