/**
 * @agent / @runa mention trigger system.
 *
 * Detects @agent and @runa mentions in comment text, rate-limits per task,
 * and orchestrates a background agent session that processes the instruction
 * and posts a reply comment as a threaded reply.
 */

import { generateText, stepCountIs } from "ai";
import { and, desc, eq, or } from "drizzle-orm";

import { dbPool } from "lib/db/db";
import { posts, projects, tasks, users } from "lib/db/schema";
import { isAgentEnabled } from "lib/flags";
import { resolveAgentConfig } from "../config";
import { buildProjectContext } from "../prompts/projectContext";
import { buildSystemPrompt } from "../prompts/system";
import { createOpenRouterModel } from "../provider";
import { checkRateLimit } from "../rateLimit";
import { createSession, saveSessionMessages } from "../session/manager";
import { buildTriggerTools } from "../tools";
import { markdownToHtml } from "../tools/core/markdown";

import type { WriteToolContext } from "../tools";

// ─────────────────────────────────────────────
// Mention Detection
// ─────────────────────────────────────────────

export const MAX_INSTRUCTION_LENGTH = 2_000;

export function stripHtml(html: string): string {
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

interface MentionDetectionResult {
  hasMention: boolean;
  instruction: string;
}

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

const TASK_RATE_LIMIT = { maxRequests: 3, windowMs: 3_600_000 } as const;
const USER_RATE_LIMIT = { maxRequests: 10, windowMs: 3_600_000 } as const;

// ─────────────────────────────────────────────
// Thread Context
// ─────────────────────────────────────────────

interface ThreadContext {
  /** The originating comment that triggered the mention. */
  originComment: {
    id: string;
    parentId: string | null;
    description: string | null;
    authorName: string | null;
  };
  /** Previous messages in the thread (parent + siblings), ordered chronologically. */
  threadMessages: Array<{
    id: string;
    description: string | null;
    authorName: string | null;
    isAgent: boolean;
  }>;
  /** The parentId to use for the agent's reply (flat threading). */
  replyParentId: string;
}

/**
 * Find the originating comment and build thread context.
 *
 * Since the plugin fires as a side effect, the comment may not exist yet.
 * We retry a few times with a short delay to account for transaction timing.
 *
 * @param taskId - The task ID
 * @param userId - The user who made the comment
 * @param commentText - The comment text (used to find the comment)
 * @param inputParentId - The parentId from the mutation input (if this is a reply)
 */
async function buildThreadContext(
  taskId: string,
  userId: string,
  commentText: string,
  inputParentId?: string | null,
): Promise<ThreadContext | null> {
  // Retry logic: the comment may not be committed yet
  const maxRetries = 3;
  const retryDelayMs = 100;

  let originComment: ThreadContext["originComment"] | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    if (attempt > 0) {
      await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
    }

    // Find the most recent comment matching our criteria
    const found = await dbPool.query.posts.findFirst({
      where: and(
        eq(posts.taskId, taskId),
        eq(posts.authorId, userId),
        eq(posts.description, commentText),
      ),
      orderBy: desc(posts.createdAt),
      columns: {
        id: true,
        parentId: true,
        description: true,
      },
      with: {
        author: {
          columns: { name: true },
        },
      },
    });

    if (found) {
      originComment = {
        id: found.id,
        parentId: found.parentId,
        description: found.description,
        authorName: found.author?.name ?? null,
      };
      break;
    }
  }

  if (!originComment) {
    console.warn("[AI Mention] Could not find originating comment");
    // If we have inputParentId, we can still build partial context
    if (!inputParentId) return null;
  }

  // Determine flat threading: if origin has a parent, reply to same parent
  // Otherwise, reply to the origin comment itself
  // Use inputParentId as fallback if we couldn't find the origin comment
  const replyParentId =
    originComment?.parentId ?? inputParentId ?? originComment?.id;

  if (!replyParentId) {
    console.warn("[AI Mention] Could not determine reply parent ID");
    return null;
  }

  // Fetch thread context: the parent comment + all replies (siblings)
  const threadPosts = await dbPool.query.posts.findMany({
    where: or(
      // The parent comment itself
      eq(posts.id, replyParentId),
      // All replies to the parent (siblings in the thread)
      eq(posts.parentId, replyParentId),
    ),
    orderBy: posts.createdAt,
    columns: {
      id: true,
      description: true,
      authorId: true,
    },
    with: {
      author: {
        columns: { name: true },
      },
    },
  });

  const threadMessages: ThreadContext["threadMessages"] = threadPosts.map(
    (post) => ({
      id: post.id,
      description: post.description,
      authorName: post.author?.name ?? null,
      isAgent: post.authorId === null,
    }),
  );

  return {
    originComment: originComment ?? {
      id: "",
      parentId: inputParentId ?? null,
      description: commentText,
      authorName: null,
    },
    threadMessages,
    replyParentId,
  };
}

/**
 * Format thread context as conversation history for the AI prompt.
 */
function formatThreadHistory(
  threadMessages: ThreadContext["threadMessages"],
): string {
  if (threadMessages.length <= 1) {
    return "";
  }

  const formatted = threadMessages
    .map((msg) => {
      const author = msg.isAgent ? "Runa (you)" : (msg.authorName ?? "User");
      const content = msg.description ? stripHtml(msg.description) : "(empty)";
      return `[${author}]: ${content}`;
    })
    .join("\n");

  return `\n\nThread history:\n${formatted}`;
}

// ─────────────────────────────────────────────
// Mention Handler
// ─────────────────────────────────────────────

export interface MentionContext {
  taskId: string;
  userId: string;
  accessToken: string;
  commentText: string;
  /** Parent comment ID if this is a reply (for threading context). */
  parentId?: string | null;
}

export async function handleMention(ctx: MentionContext): Promise<void> {
  try {
    const enabled = await isAgentEnabled();
    if (!enabled) return;

    const userRateResult = checkRateLimit(
      `mention:user:${ctx.userId}`,
      USER_RATE_LIMIT,
    );
    if (!userRateResult.allowed) return;

    const taskRateResult = checkRateLimit(
      `mention:task:${ctx.taskId}`,
      TASK_RATE_LIMIT,
    );
    if (!taskRateResult.allowed) return;

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

    // Build thread context for continuity
    const threadContext = await buildThreadContext(
      ctx.taskId,
      ctx.userId,
      ctx.commentText,
      ctx.parentId,
    );

    const agentConfig = await resolveAgentConfig(organizationId);

    const session = await createSession({
      organizationId,
      projectId,
      userId: ctx.userId,
      title: `@mention on T-${task.number}`,
    });

    const user = await dbPool.query.users.findFirst({
      where: eq(users.id, ctx.userId),
      columns: { name: true },
    });

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
    const model = createOpenRouterModel(
      agentConfig.model,
      agentConfig.orgApiKey,
    );

    const toolContext: WriteToolContext = {
      projectId,
      organizationId,
      userId: ctx.userId,
      accessToken: ctx.accessToken,
      sessionId: session.id,
    };

    // Build tools using the trigger preset (skips permission checks)
    const aiTools = buildTriggerTools(toolContext);

    const { instruction } = detectMention(ctx.commentText);

    // Include thread history for context continuity
    const threadHistory = threadContext
      ? formatThreadHistory(threadContext.threadMessages)
      : "";

    const userMessage = instruction
      ? `A user mentioned you in a comment on task T-${task.number} ("${task.content}"). Their instruction: "${instruction}".${threadHistory}\n\nRespond concisely, keeping the conversation context in mind.`
      : `A user mentioned you in a comment on task T-${task.number} ("${task.content}"). Review the task and provide a brief helpful summary.${threadHistory}`;

    const result = await generateText({
      model,
      messages: [{ role: "user", content: userMessage }],
      tools: aiTools,
      system: systemPrompt,
      stopWhen: stepCountIs(agentConfig.maxIterations),
    });

    const allMessages: Array<{ role: "user" | "assistant"; content: string }> =
      [{ role: "user", content: userMessage }];

    if (result.text) {
      const replyHtml = markdownToHtml(result.text);

      // Insert reply as a threaded comment (flat threading)
      await dbPool.insert(posts).values({
        description: replyHtml,
        authorId: null,
        taskId: ctx.taskId,
        // Use thread context for proper threading, fallback to null (top-level)
        parentId: threadContext?.replyParentId ?? null,
      });

      allMessages.push({ role: "assistant", content: result.text });
    }

    await saveSessionMessages(session.id, allMessages);

    console.info("[AI Mention] Completed:", {
      taskId: ctx.taskId,
      taskNumber: task.number,
      sessionId: session.id,
      hasResponse: !!result.text,
      threadParentId: threadContext?.replyParentId ?? null,
    });
  } catch (err) {
    console.error("[AI Mention] Error:", {
      taskId: ctx.taskId,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}
