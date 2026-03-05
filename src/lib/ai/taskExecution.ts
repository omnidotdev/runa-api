/**
 * Task execution orchestrator.
 *
 * Runs an autonomous code agent in a Docker sandbox to complete
 * a board task by cloning a repo, making changes, and opening a PR.
 *
 * Follows the same pattern as handleMention() but with container lifecycle.
 */

import { generateText, stepCountIs } from "ai";
import { eq } from "drizzle-orm";

import { dbPool } from "lib/db/db";
import {
  agentSessions,
  githubInstallations,
  githubRepositories,
  projects,
  taskExecutions,
  tasks,
} from "lib/db/schema";
import { createSandbox, destroySandbox } from "lib/docker/sandbox";
import { getInstallationToken } from "lib/github/client";
import { resolveAgentConfig } from "./config";
import {
  DEFAULT_EXECUTION_MODEL,
  EXECUTION_MAX_ITERATIONS,
  EXECUTION_TIMEOUT_MS,
} from "./constants";
import { buildTaskExecutionPrompt } from "./prompts/taskExecution";
import { createOpenRouterModel } from "./provider";
import { buildExecutionTools } from "./tools/presets/buildExecutionTools";

import type {
  TaskExecutionMetadata,
  TaskExecutionStatus,
} from "lib/db/schema/taskExecution.table";
import type { ExecutionToolContext } from "./tools/core/executionContext";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface RunTaskExecutionParams {
  executionId: string;
  taskId: string;
  projectId: string;
  organizationId: string;
  userId: string;
  accessToken: string;
  model?: string;
}

// ─────────────────────────────────────────────
// Orchestrator
// ─────────────────────────────────────────────

/**
 * Run an autonomous task execution.
 *
 * 1. Load task, GitHub installation, and repo from DB
 * 2. Create agent session
 * 3. Fetch installation token, create sandbox, clone repo
 * 4. Build execution context + tools
 * 5. Run agentic loop with generateText()
 * 6. Extract PR URL from tool results
 * 7. Update execution status
 * 8. Destroy container (always, in finally)
 */
export async function runTaskExecution(
  params: RunTaskExecutionParams,
): Promise<void> {
  let containerId: string | undefined;

  try {
    // Mark as running
    await updateExecutionStatus(params.executionId, "running");

    // Load task
    const task = await dbPool.query.tasks.findFirst({
      where: eq(tasks.id, params.taskId),
      columns: { id: true, content: true, description: true, number: true },
    });

    if (!task) {
      throw new Error(`Task ${params.taskId} not found`);
    }

    // Load project
    const project = await dbPool.query.projects.findFirst({
      where: eq(projects.id, params.projectId),
      columns: { id: true, prefix: true, name: true, organizationId: true },
    });

    if (!project) {
      throw new Error(`Project ${params.projectId} not found`);
    }

    // Load GitHub installation
    const installation = await dbPool.query.githubInstallations.findFirst({
      where: eq(githubInstallations.organizationId, params.organizationId),
    });

    if (!installation || !installation.enabled) {
      throw new Error("GitHub App not installed for this organization");
    }

    // Load connected repository
    const repo = await dbPool.query.githubRepositories.findFirst({
      where: eq(githubRepositories.projectId, params.projectId),
    });

    if (!repo || !repo.enabled) {
      throw new Error("No repository connected to this project");
    }

    // Resolve agent config for custom instructions + org API key
    const agentConfig = await resolveAgentConfig(params.organizationId);

    // Generate branch name
    const taskPrefix = project.prefix ?? "T";
    const branchName = `runa/${taskPrefix.toLowerCase()}-${task.number}`;

    // Update metadata with branch name
    await updateExecutionMetadata(params.executionId, {
      model: params.model ?? DEFAULT_EXECUTION_MODEL,
      branchName,
    });

    // Create agent session
    const [session] = await dbPool
      .insert(agentSessions)
      .values({
        organizationId: params.organizationId,
        projectId: params.projectId,
        userId: params.userId,
        type: "task_execution",
        title: `Execution: ${taskPrefix}-${task.number}`,
        messages: [],
        metadata: { executionId: params.executionId },
      })
      .returning();

    // Link session to execution
    await dbPool
      .update(taskExecutions)
      .set({ sessionId: session.id })
      .where(eq(taskExecutions.id, params.executionId));

    // Get installation token
    const token = await getInstallationToken(installation.installationId);

    // Create sandbox with repo
    const repoUrl = `https://github.com/${repo.repoFullName}.git`;

    containerId = await createSandbox({
      githubToken: token,
      repoUrl,
      branchName,
      baseBranch: repo.defaultBranch,
    });

    await updateExecutionMetadata(params.executionId, { containerId });

    // Build execution context
    const executionContext: ExecutionToolContext = {
      projectId: params.projectId,
      organizationId: params.organizationId,
      userId: params.userId,
      accessToken: params.accessToken,
      sessionId: session.id,
      containerId,
      installationId: installation.installationId,
      repoFullName: repo.repoFullName,
      branchName,
      executionId: params.executionId,
    };

    // Build tools and system prompt
    const aiTools = buildExecutionTools(executionContext);
    const systemPrompt = buildTaskExecutionPrompt({
      taskPrefix,
      taskNumber: task.number ?? 0,
      taskTitle: task.content ?? "Untitled task",
      taskDescription: task.description,
      repoFullName: repo.repoFullName,
      branchName,
      customInstructions: agentConfig.customInstructions,
    });

    // Create the model
    const model = createOpenRouterModel(
      params.model ?? DEFAULT_EXECUTION_MODEL,
      agentConfig.orgApiKey,
    );

    // Run agentic loop with timeout
    const userMessage = `You have been assigned task ${taskPrefix}-${task.number}: "${task.content}". Complete this task by making the necessary code changes in the repository and opening a pull request.`;

    const executionPromise = generateText({
      model,
      messages: [{ role: "user", content: userMessage }],
      tools: aiTools,
      system: systemPrompt,
      stopWhen: stepCountIs(EXECUTION_MAX_ITERATIONS),
    });

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(
        () => reject(new Error("Execution timed out")),
        EXECUTION_TIMEOUT_MS,
      );
    });

    const result = await Promise.race([executionPromise, timeoutPromise]);

    // Extract PR info from tool results
    // biome-ignore lint/suspicious/noExplicitAny: Vercel AI SDK generics don't narrow cleanly across ToolSet
    const prInfo = extractPrInfo(result as any);

    // Update execution as succeeded
    await updateExecutionStatus(params.executionId, "succeeded");
    await updateExecutionMetadata(params.executionId, {
      stepCount: result.steps?.length ?? 0,
      ...(prInfo && { prUrl: prInfo.prUrl, prNumber: prInfo.prNumber }),
    });

    console.info("[TaskExecution] Completed:", {
      executionId: params.executionId,
      taskId: params.taskId,
      prUrl: prInfo?.prUrl,
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);

    console.error("[TaskExecution] Failed:", {
      executionId: params.executionId,
      error: errorMessage,
    });

    await updateExecutionStatus(params.executionId, "failed");
    await updateExecutionMetadata(params.executionId, { errorMessage });
  } finally {
    // Always destroy the container
    if (containerId) {
      await destroySandbox(containerId).catch((err) => {
        console.error("[TaskExecution] Failed to destroy sandbox:", err);
      });
    }
  }
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

/**
 * Update execution status.
 */
async function updateExecutionStatus(
  executionId: string,
  status: TaskExecutionStatus,
): Promise<void> {
  await dbPool
    .update(taskExecutions)
    .set({
      status: status as TaskExecutionStatus,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(taskExecutions.id, executionId));
}

/**
 * Merge metadata fields into the execution record.
 */
async function updateExecutionMetadata(
  executionId: string,
  metadata: Partial<TaskExecutionMetadata>,
): Promise<void> {
  const existing = await dbPool.query.taskExecutions.findFirst({
    where: eq(taskExecutions.id, executionId),
    columns: { metadata: true },
  });

  const merged = {
    ...(existing?.metadata ?? {}),
    ...metadata,
  };

  await dbPool
    .update(taskExecutions)
    .set({
      metadata: merged,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(taskExecutions.id, executionId));
}

/**
 * Extract PR URL and number from generateText result tool calls.
 */
// biome-ignore lint/suspicious/noExplicitAny: Vercel AI SDK tool result generics
function extractPrInfo(
  result: any,
): { prUrl: string; prNumber: number } | null {
  for (const step of result.steps ?? []) {
    for (const call of step.toolCalls ?? []) {
      if (call.toolName === "createPullRequest") {
        const toolResult = step.toolResults?.find(
          (r: any) => r.toolCallId === call.toolCallId,
        );

        if (toolResult?.result) {
          const res = toolResult.result as {
            prUrl?: string;
            prNumber?: number;
          };

          if (res.prUrl && res.prNumber) {
            return { prUrl: res.prUrl, prNumber: res.prNumber };
          }
        }
      }
    }
  }

  return null;
}
