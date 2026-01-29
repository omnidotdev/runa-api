/**
 * @agent / @runa mention trigger system.
 *
 * Detects @agent and @runa mentions in comment text, rate-limits per task,
 * and orchestrates a background agent session that processes the instruction
 * and posts a reply comment.
 */

import { generateText, stepCountIs } from "ai";
import { eq } from "drizzle-orm";

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

function textToHtml(text: string): string {
  const paragraphs = text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  if (paragraphs.length === 0) return "<p></p>";
  return paragraphs.map((p) => `<p>${escapeHtml(p)}</p>`).join("");
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
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
// Mention Handler
// ─────────────────────────────────────────────

export interface MentionContext {
  taskId: string;
  userId: string;
  accessToken: string;
  commentText: string;
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

    const userMessage = instruction
      ? `A user mentioned you in a comment on task T-${task.number} ("${task.content}"). Their instruction: "${instruction}". Respond concisely.`
      : `A user mentioned you in a comment on task T-${task.number} ("${task.content}"). Review the task and provide a brief helpful summary.`;

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
      const replyHtml = textToHtml(result.text);

      await dbPool.insert(posts).values({
        description: replyHtml,
        authorId: null,
        taskId: ctx.taskId,
      });

      allMessages.push({ role: "assistant", content: result.text });
    }

    await saveSessionMessages(session.id, allMessages);

    console.info("[AI Mention] Completed:", {
      taskId: ctx.taskId,
      taskNumber: task.number,
      sessionId: session.id,
      hasResponse: !!result.text,
    });
  } catch (err) {
    console.error("[AI Mention] Error:", {
      taskId: ctx.taskId,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}
