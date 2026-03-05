/**
 * Create pull request tool definition.
 *
 * Pushes the feature branch and creates a PR via GitHub API.
 * Combines sandbox git push with GitHub App API call.
 */

import { execInSandbox } from "lib/docker/sandbox";
import { createPullRequest as createGitHubPR } from "lib/github/client";

import type { ExecutionToolContext } from "../../core/executionContext";
import type { CreatePullRequestInput } from "../../core/schemas";

export const CREATE_PULL_REQUEST_DESCRIPTION =
  "Push the current branch and create a pull request on GitHub. Use after committing all changes.";

export async function executeCreatePullRequest(
  input: CreatePullRequestInput,
  ctx: ExecutionToolContext,
): Promise<{ prUrl: string; prNumber: number }> {
  // Push the branch
  const pushResult = await execInSandbox(
    ctx.containerId,
    ["bash", "-c", `git push origin "${ctx.branchName}" 2>&1`],
    60_000, // 60s timeout for push
  );

  if (pushResult.exitCode !== 0) {
    throw new Error(
      `Failed to push branch: ${pushResult.stdout.trim()} ${pushResult.stderr.trim()}`,
    );
  }

  // Parse owner/repo from repoFullName
  const [owner, repo] = ctx.repoFullName.split("/");

  if (!owner || !repo) {
    throw new Error(`Invalid repository name: ${ctx.repoFullName}`);
  }

  // Get the default branch from repo config
  const defaultBranchResult = await execInSandbox(ctx.containerId, [
    "bash",
    "-c",
    "echo $BASE_BRANCH",
  ]);

  const baseBranch = defaultBranchResult.stdout.trim() || "main";

  // Create PR via GitHub API
  const result = await createGitHubPR({
    installationId: ctx.installationId,
    owner,
    repo,
    title: input.title,
    body: input.body,
    head: ctx.branchName,
    base: baseBranch,
  });

  return {
    prUrl: result.prUrl,
    prNumber: result.prNumber,
  };
}
