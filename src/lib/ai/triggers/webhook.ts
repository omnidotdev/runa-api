/**
 * Webhook-triggered agent system.
 *
 * Receives signed webhook payloads from external services (e.g. GitHub),
 * verifies the HMAC-SHA256 signature, resolves the webhook configuration,
 * and runs a scoped agent session that processes the instruction template
 * with the event payload.
 *
 * Security:
 *  - HMAC-SHA256 signature verification using timing-safe comparison
 *  - Rate limited per webhook (5 per hour) and per project (20 per hour)
 *  - Destructive tools are excluded (same as mention-triggered sessions)
 *  - Instruction template length is capped at 4000 characters
 */

import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

import { chat, maxIterations } from "@tanstack/ai";
import { and, eq } from "drizzle-orm";

import { dbPool } from "lib/db/db";
import { agentWebhooks, userOrganizations } from "lib/db/schema";
import { isAgentEnabled } from "lib/flags";
import { createAdapter, resolveAgentConfig } from "../config";
import { decrypt } from "../encryption";
import { buildProjectContext } from "../prompts/projectContext";
import { buildSystemPrompt } from "../prompts/system";
import { checkRateLimit } from "../rateLimit";
import { createSession, saveSessionMessages } from "../session/manager";
import { createQueryTools, createWriteTools } from "../tools/server";

import type { StreamChunk } from "@tanstack/ai";

// ─────────────────────────────────────────────
// Signature Verification
// ─────────────────────────────────────────────

/**
 * Generate a random signing secret for a new webhook.
 * Returns a 32-byte hex string (64 characters).
 */
export function generateSigningSecret(): string {
  return randomBytes(32).toString("hex");
}

/**
 * Verify an HMAC-SHA256 signature against a payload and an encrypted secret.
 *
 * The signing secret is stored encrypted at rest (AES-256-GCM). This function
 * decrypts it in memory for the verification, then discards the plaintext.
 * Uses timing-safe comparison to prevent timing attacks.
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  encryptedSecret: string,
): boolean {
  try {
    const secret = decrypt(encryptedSecret);
    const expected = createHmac("sha256", secret).update(payload).digest("hex");

    const sigBuffer = Buffer.from(signature, "hex");
    const expectedBuffer = Buffer.from(expected, "hex");

    if (sigBuffer.length !== expectedBuffer.length) {
      return false;
    }

    return timingSafeEqual(sigBuffer, expectedBuffer);
  } catch {
    return false;
  }
}

// ─────────────────────────────────────────────
// Rate Limiting
// ─────────────────────────────────────────────

/** Max 5 webhook-triggered agent runs per webhook per hour. */
const WEBHOOK_RATE_LIMIT = {
  maxRequests: 5,
  windowMs: 3_600_000,
} as const;

/** Max 20 webhook-triggered agent runs per project per hour. */
const PROJECT_WEBHOOK_RATE_LIMIT = {
  maxRequests: 20,
  windowMs: 3_600_000,
} as const;

// ─────────────────────────────────────────────
// Supported Event Types
// ─────────────────────────────────────────────

/** Supported webhook event types. */
export const WEBHOOK_EVENT_TYPES = [
  "github.pr_merged",
  "github.issue_opened",
  "custom",
] as const;

/** Max instruction length after template interpolation. */
const MAX_INSTRUCTION_LENGTH = 4_000;

// ─────────────────────────────────────────────
// Template Interpolation
// ─────────────────────────────────────────────

/**
 * Interpolate the instruction template with event data.
 *
 * Supported placeholders:
 *  - {event}     — JSON-stringified event payload (truncated)
 *  - {eventType} — The event type string
 */
function interpolateTemplate(
  template: string,
  eventType: string,
  eventPayload: Record<string, unknown>,
): string {
  const eventJson = JSON.stringify(eventPayload).slice(0, 2000);

  return template
    .replace(/\{event\}/g, eventJson)
    .replace(/\{eventType\}/g, eventType)
    .slice(0, MAX_INSTRUCTION_LENGTH);
}

// ─────────────────────────────────────────────
// Webhook Handler
// ─────────────────────────────────────────────

export interface WebhookContext {
  /** The webhook configuration row ID. */
  webhookId: string;
  /** The project the webhook is scoped to. */
  projectId: string;
  /** The organization the webhook belongs to (from webhook row). */
  organizationId: string;
  /** Raw webhook event type string. */
  eventType: string;
  /** Parsed event payload (JSON body). */
  eventPayload: Record<string, unknown>;
}

/**
 * Handle a verified webhook event.
 *
 * Runs asynchronously (fire-and-forget from the webhook receiver endpoint).
 * All errors are caught and logged internally.
 *
 * Security notes:
 *  - Destructive tools are excluded to limit blast radius of external events.
 *  - Rate limited per webhook and per project.
 *  - Uses a "system" user context since webhooks are not user-initiated.
 */
export async function handleWebhook(ctx: WebhookContext): Promise<void> {
  try {
    // 1. Feature flag
    const enabled = await isAgentEnabled();
    if (!enabled) return;

    // 2. Rate limit — per webhook + per project
    const webhookRateResult = checkRateLimit(
      `webhook:id:${ctx.webhookId}`,
      WEBHOOK_RATE_LIMIT,
    );
    if (!webhookRateResult.allowed) {
      console.info("[AI Webhook] Rate limited for webhook:", ctx.webhookId);
      return;
    }

    const projectRateResult = checkRateLimit(
      `webhook:project:${ctx.projectId}`,
      PROJECT_WEBHOOK_RATE_LIMIT,
    );
    if (!projectRateResult.allowed) {
      console.info("[AI Webhook] Rate limited for project:", ctx.projectId);
      return;
    }

    // 3. Load webhook config
    const webhook = await dbPool.query.agentWebhooks.findFirst({
      where: and(
        eq(agentWebhooks.id, ctx.webhookId),
        eq(agentWebhooks.projectId, ctx.projectId),
        eq(agentWebhooks.enabled, true),
      ),
    });
    if (!webhook) return;

    const organizationId = ctx.organizationId;

    // 4. Resolve agent config
    const agentConfig = await resolveAgentConfig(organizationId);
    const { orgApiKey, model } = agentConfig;

    const adapter = createAdapter(model, orgApiKey);

    // 5. Create session for audit trail.
    // Webhooks are not user-initiated, so we use a placeholder userId.
    // We need a valid user to satisfy FK constraints — find the first
    // member of this organization (scoped, not a global user query).
    const orgMembership = await dbPool.query.userOrganizations.findFirst({
      where: eq(userOrganizations.organizationId, organizationId),
      columns: { userId: true },
      with: { user: { columns: { id: true, name: true } } },
    });
    if (!orgMembership?.user) return;

    const firstUser = orgMembership.user;

    const session = await createSession({
      organizationId,
      projectId: ctx.projectId,
      userId: firstUser.id,
      title: `Webhook: ${webhook.name} (${ctx.eventType})`,
    });

    // 7. Build system prompt
    const projectContext = await buildProjectContext({
      projectId: ctx.projectId,
      organizationId,
      userId: firstUser.id,
      userName: "Webhook Trigger",
      customInstructions: agentConfig.customInstructions,
    });

    const systemPrompt = buildSystemPrompt(
      projectContext,
      agentConfig.defaultPersona,
    );

    // 8. Build tools — no destructive tools for webhook-triggered sessions
    const writeContext = {
      projectId: ctx.projectId,
      organizationId,
      userId: firstUser.id,
      accessToken: "", // Webhooks don't have a user access token
      sessionId: session.id,
    };

    const { queryTasks, queryProject, getTask } = createQueryTools({
      projectId: ctx.projectId,
      organizationId,
    });

    const {
      createTask,
      updateTask,
      moveTask,
      assignTask,
      addLabel,
      removeLabel,
      addComment,
    } = createWriteTools(writeContext, {
      requireApprovalForCreate: agentConfig.requireApprovalForCreate,
    });

    // 9. Build user message from template + event
    const instruction = interpolateTemplate(
      webhook.instructionTemplate,
      ctx.eventType,
      ctx.eventPayload,
    );

    const userMessage = `A webhook event "${ctx.eventType}" was received for this project. ${instruction}`;

    // 10. Run agent tool loop
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

    const allMessages: Array<{ role: string; content: string }> = [
      { role: "user", content: userMessage },
    ];

    let assistantContent = "";
    for await (const chunk of aiStream) {
      if (chunk.type === "content" && chunk.content) {
        assistantContent = chunk.content;
      }
    }

    if (assistantContent) {
      allMessages.push({ role: "assistant", content: assistantContent });
    }

    // 11. Persist session and update webhook trigger timestamp
    await saveSessionMessages(session.id, allMessages);

    await dbPool
      .update(agentWebhooks)
      .set({ lastTriggeredAt: new Date() })
      .where(eq(agentWebhooks.id, ctx.webhookId));

    console.info("[AI Webhook] Completed:", {
      webhookId: ctx.webhookId,
      projectId: ctx.projectId,
      eventType: ctx.eventType,
      sessionId: session.id,
      hasResponse: !!assistantContent,
    });
  } catch (err) {
    console.error("[AI Webhook] Unhandled error:", {
      webhookId: ctx.webhookId,
      projectId: ctx.projectId,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}
