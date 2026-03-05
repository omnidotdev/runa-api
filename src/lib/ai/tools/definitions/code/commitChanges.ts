/**
 * Commit changes tool definition.
 *
 * Stages and commits changes in the sandbox repository.
 * Uses the Runa Agent identity for commits.
 */

import { execInSandbox } from "lib/docker/sandbox";

import type { ExecutionToolContext } from "../../core/executionContext";
import type { CommitChangesInput } from "../../core/schemas";

export const COMMIT_CHANGES_DESCRIPTION =
  "Stage and commit code changes in the repository. Optionally specify files to stage, otherwise stages all changes.";

export async function executeCommitChanges(
  input: CommitChangesInput,
  ctx: ExecutionToolContext,
): Promise<{ commitSha: string; filesChanged: number }> {
  // Stage files
  const stageCommand = input.files
    ? `git add ${input.files.map((f) => `"${f}"`).join(" ")}`
    : "git add -A";

  const stageResult = await execInSandbox(ctx.containerId, [
    "bash",
    "-c",
    stageCommand,
  ]);

  if (stageResult.exitCode !== 0) {
    throw new Error(`Failed to stage files: ${stageResult.stderr.trim()}`);
  }

  // Check if there are staged changes
  const statusResult = await execInSandbox(ctx.containerId, [
    "bash",
    "-c",
    "git diff --cached --stat",
  ]);

  if (!statusResult.stdout.trim()) {
    return { commitSha: "", filesChanged: 0 };
  }

  // Commit
  const escapedMessage = input.message.replace(/"/g, '\\"');
  const commitResult = await execInSandbox(ctx.containerId, [
    "bash",
    "-c",
    `git commit -m "${escapedMessage}"`,
  ]);

  if (commitResult.exitCode !== 0) {
    throw new Error(`Failed to commit: ${commitResult.stderr.trim()}`);
  }

  // Get commit SHA
  const shaResult = await execInSandbox(ctx.containerId, [
    "bash",
    "-c",
    "git rev-parse HEAD",
  ]);

  const commitSha = shaResult.stdout.trim();
  const filesChanged = statusResult.stdout
    .split("\n")
    .filter((l) => l.trim().length > 0).length;

  return { commitSha, filesChanged };
}
