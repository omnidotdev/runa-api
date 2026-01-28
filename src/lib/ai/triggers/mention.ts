/**
 * @agent / @runa mention trigger system.
 *
 * Detects @agent and @runa mentions in comment text, rate-limits per task,
 * and orchestrates a background agent session that processes the instruction
 * and posts a reply comment.
 *
 * This module is called from the PostMention PostGraphile plugin as a
 * fire-and-forget side effect after comment creation.
 */

import { chat, maxIterations } from "@tanstack/ai";
import { eq } from "drizzle-orm";

import { dbPool } from "lib/db/db";
import { posts, projects, tasks, users } from "lib/db/schema";
import { isAgentEnabled } from "lib/flags";

import { createAdapter, resolveAgentConfig } from "../config";
import { buildProjectContext } from "../prompts/projectContext";
import { buildSystemPrompt } from "../prompts/system";
import { checkRateLimit } from "../rateLimit";
import { createSession, saveSessionMessages } from "../session/manager";
import { createQueryTools, createWriteTools } from "../tools/server";

import type { StreamChunk } from "@tanstack/ai";

// ─────────────────────────────────────────────
// Mention Detection
// ─────────────────────────────────────────────

/** Maximum instruction length to prevent excessively long prompts. */
const MAX_INSTRUCTION_LENGTH = 2_000;

/**
 * Strip HTML tags from content to get plain text for mention detection.
 *
 * NOTE: This is intentionally simple and only used for mention detection.
 * It is NOT a general-purpose HTML sanitizer. Edge cases like `>` inside
 * attributes may produce imperfect output, but that only causes false
 * negatives for mention detection — not a security issue.
 */
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Convert plain text to basic HTML for storage as a comment.
 * Wraps paragraphs in `<p>` tags.
 */
function textToHtml(text: string): string {
  const paragraphs = text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  if (paragraphs.length === 0) return "<p></p>";
  return paragraphs.map((p) => `<p>${escapeHtml(p)}</p>`).join("");
}

/** Escape special HTML characters. */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

interface MentionDetectionResult {
  /** Whether @agent or @runa was found. */
  hasMention: boolean;
  /** The comment text with the mention removed (the instruction). */
  instruction: string;
}

/**
 * Detect @agent / @runa mentions in comment HTML.
 *
 * Returns whether a mention was found and the extracted instruction
 * (the comment text with the mention removed, capped at MAX_INSTRUCTION_LENGTH).
 *
 * Uses locally-scoped regex to avoid shared mutable `lastIndex` state
 * that could cause race conditions under concurrent calls.
 */
export function detectMention(htmlContent: string): MentionDetectionResult {
  const plainText = stripHtml(htmlContent);
  const hasMention = /@(?:agent|runa)\b/i.test(plainText);

  const instruction = plainText
    .replace(/@(?:agent|runa)\b/gi, "")
    .trim()
    .slice(0, MAX_INSTRUCTION_LENGTH);

  return { hasMention, instruction };
}

// ─────────────────────────────────────────────
// Rate Limiting
// ─────────────────────────────────────────────

/** Max 3 mention-triggered agent runs per task per hour. */
const TASK_RATE_LIMIT = {
  maxRequests: 3,
  windowMs: 3_600_000,
} as const;

/** Max 10 mention-triggered agent runs per user per hour (across all tasks). */
const USER_RATE_LIMIT = {
  maxRequests: 10,
  windowMs: 3_600_000,
} as const;

// ─────────────────────────────────────────────
// Mention Handler
// ─────────────────────────────────────────────

export interface MentionContext {
  /** UUID of the task the comment was posted on. */
  taskId: string;
  /** UUID of the user who posted the mention comment. */
  userId: string;
  /** JWT access token for permission checks. */
  accessToken: string;
  /** Raw HTML content of the comment. */
  commentText: string;
}

/**
 * Handle an @agent mention detected in a comment.
 *
 * This function runs asynchronously (fire-and-forget from the PostGraphile
 * sideEffect) and should never throw to the caller. All errors are caught
 * and logged internally.
 *
 * Security notes:
 *  - Authorization relies on PostPlugin's pre-mutation member check — if
 *    the user can create a comment on the task, they can trigger a mention.
 *  - Destructive tools (delete, batch) are intentionally excluded from
 *    mention-triggered sessions to limit the blast radius of prompt injection.
 *  - The agent's reply is posted via direct DB insert (NOT the GraphQL
 *    mutation), so it will NOT re-trigger the PostMention plugin.
 *
 * Flow:
 *  1. Feature flag + rate limit check
 *  2. Resolve task → project → organization
 *  3. Resolve agent config and build system prompt
 *  4. Create tools and adapter
 *  5. Run the agent tool loop
 *  6. Post the agent's response as a reply comment
 *  7. Persist session for audit trail
 */
export async function handleMention(ctx: MentionContext): Promise<void> {
  try {
    // 1. Feature flag
    const enabled = await isAgentEnabled();
    if (!enabled) return;

    // 2. Rate limit — compound: per-user across all tasks + per-task
    const userRateResult = checkRateLimit(
      `mention:user:${ctx.userId}`,
      USER_RATE_LIMIT,
    );
    if (!userRateResult.allowed) {
      // biome-ignore lint/suspicious/noConsole: rate limit logging
      console.info("[AI Mention] Rate limited for user:", ctx.userId);
      return;
    }

    const taskRateResult = checkRateLimit(
      `mention:task:${ctx.taskId}`,
      TASK_RATE_LIMIT,
    );
    if (!taskRateResult.allowed) {
      // biome-ignore lint/suspicious/noConsole: rate limit logging
      console.info("[AI Mention] Rate limited for task:", ctx.taskId);
      return;
    }

    // 3. Resolve task → project → organization
    const task = await dbPool.query.tasks.findFirst({
      where: eq(tasks.id, ctx.taskId),
      columns: { id: true, projectId: true, content: true, number: true },
    });
    if (!task) return;

    const project = await dbPool.query.projects.findFirst({
      where: eq(projects.id, task.projectId),
      columns: { id: true, organizationId: true },
    });
    if (!project) return;

    const organizationId = project.organizationId;
    const projectId = task.projectId;

    // 4. Resolve agent config
    const agentConfig = await resolveAgentConfig(organizationId);
    const { orgApiKey, ...safeConfig } = agentConfig;

    const adapter = createAdapter(
      safeConfig.provider,
      safeConfig.model,
      orgApiKey,
    );

    // 5. Create session for audit trail
    const session = await createSession({
      organizationId,
      projectId,
      userId: ctx.userId,
      title: `@mention on T-${task.number}`,
    });

    // Look up user name for system prompt context
    const user = await dbPool.query.users.findFirst({
      where: eq(users.id, ctx.userId),
      columns: { name: true },
    });

    // 6. Build system prompt
    const projectContext = await buildProjectContext({
      projectId,
      organizationId,
      userId: ctx.userId,
      userName: user?.name ?? "Unknown",
      customInstructions: agentConfig.customInstructions,
    });

    const systemPrompt = buildSystemPrompt(
      projectContext,
      agentConfig.defaultPersona,
    );

    // 7. Build tools — intentionally excludes destructive tools (deleteTask,
    // batchMoveTasks, batchUpdateTasks, batchDeleteTasks) to limit the
    // blast radius of user-supplied instructions via mentions.
    const writeContext = {
      projectId,
      organizationId,
      userId: ctx.userId,
      accessToken: ctx.accessToken,
      sessionId: session.id,
    };

    const { queryTasks, queryProject, getTask } = createQueryTools({
      projectId,
      organizationId,
    });

    const { createTask, updateTask, moveTask, assignTask, addLabel, removeLabel, addComment } =
      createWriteTools(writeContext, {
        requireApprovalForCreate: agentConfig.requireApprovalForCreate,
      });

    // 8. Build the user message from the mention
    const { instruction } = detectMention(ctx.commentText);

    const userMessage = instruction
      ? `A user mentioned you in a comment on task T-${task.number} ("${task.content}"). Their instruction: "${instruction}". Respond concisely.`
      : `A user mentioned you in a comment on task T-${task.number} ("${task.content}"). Review the task and provide a brief helpful summary.`;

    // 9. Run agent tool loop (no destructive tools available)
    const aiStream: AsyncIterable<StreamChunk> = chat({
      adapter,
      // biome-ignore lint/suspicious/noExplicitAny: dynamic adapter requires cast
      messages: [{ role: "user" as const, content: userMessage }] as any,
      tools: [
        queryTasks,
        queryProject,
        getTask,
        createTask,
        updateTask,
        moveTask,
        assignTask,
        addLabel,
        removeLabel,
        addComment,
      ],
      systemPrompts: [systemPrompt],
      agentLoopStrategy: maxIterations(agentConfig.maxIterations),
    });

    let assistantContent = "";
    const allMessages: Array<{ role: string; content: string }> = [
      { role: "user", content: userMessage },
    ];

    for await (const chunk of aiStream) {
      if (chunk.type === "content" && chunk.content) {
        assistantContent = chunk.content;
      }
    }

    // 10. Post reply comment if the agent produced a response.
    // Uses direct DB insert (NOT the GraphQL mutation) to avoid
    // re-triggering the PostMention plugin on the agent's own reply.
    if (assistantContent) {
      const replyHtml = textToHtml(`Agent\n\n${assistantContent}`);

      await dbPool.insert(posts).values({
        description: replyHtml,
        authorId: null,
        taskId: ctx.taskId,
      });

      allMessages.push({ role: "assistant", content: assistantContent });
    }

    // 11. Persist session for audit trail
    await saveSessionMessages(session.id, allMessages);

    // biome-ignore lint/suspicious/noConsole: structured mention metrics
    console.info("[AI Mention] Completed:", {
      taskId: ctx.taskId,
      taskNumber: task.number,
      sessionId: session.id,
      hasResponse: !!assistantContent,
    });
  } catch (err) {
    // biome-ignore lint/suspicious/noConsole: error logging for fire-and-forget
    console.error("[AI Mention] Unhandled error:", {
      taskId: ctx.taskId,
      userId: ctx.userId,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}
