/**
 * Webhook-triggered agent system.
 *
 * Receives signed webhook payloads from external services,
 * verifies the HMAC-SHA256 signature, and runs a scoped agent session.
 */

import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

import { generateText, stepCountIs } from "ai";
import { and, eq } from "drizzle-orm";

import { dbPool } from "lib/db/db";
import { agentWebhooks, userOrganizations } from "lib/db/schema";
import { isAgentEnabled } from "lib/flags";
import { resolveAgentConfig } from "../config";
import { decrypt } from "../encryption";
import { buildProjectContext } from "../prompts/projectContext";
import { buildSystemPrompt } from "../prompts/system";
import { createOpenRouterModel } from "../provider";
import { checkRateLimit } from "../rateLimit";
import { createSession, saveSessionMessages } from "../session/manager";
import { buildTriggerTools } from "../tools";

import type { WriteToolContext } from "../tools";

// ─────────────────────────────────────────────
// Signature Verification
// ─────────────────────────────────────────────

export function generateSigningSecret(): string {
  return randomBytes(32).toString("hex");
}

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

const WEBHOOK_RATE_LIMIT = { maxRequests: 5, windowMs: 3_600_000 } as const;
const PROJECT_WEBHOOK_RATE_LIMIT = {
  maxRequests: 20,
  windowMs: 3_600_000,
} as const;

// ─────────────────────────────────────────────
// Supported Event Types
// ─────────────────────────────────────────────

export const WEBHOOK_EVENT_TYPES = [
  "github.pr_merged",
  "github.issue_opened",
  "custom",
] as const;

const MAX_INSTRUCTION_LENGTH = 4_000;

// ─────────────────────────────────────────────
// Template Interpolation
// ─────────────────────────────────────────────

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
  webhookId: string;
  projectId: string;
  organizationId: string;
  eventType: string;
  eventPayload: Record<string, unknown>;
}

export async function handleWebhook(ctx: WebhookContext): Promise<void> {
  try {
    const enabled = await isAgentEnabled();
    if (!enabled) return;

    const webhookRateResult = checkRateLimit(
      `webhook:id:${ctx.webhookId}`,
      WEBHOOK_RATE_LIMIT,
    );
    if (!webhookRateResult.allowed) return;

    const projectRateResult = checkRateLimit(
      `webhook:project:${ctx.projectId}`,
      PROJECT_WEBHOOK_RATE_LIMIT,
    );
    if (!projectRateResult.allowed) return;

    const webhook = await dbPool.query.agentWebhooks.findFirst({
      where: and(
        eq(agentWebhooks.id, ctx.webhookId),
        eq(agentWebhooks.projectId, ctx.projectId),
        eq(agentWebhooks.enabled, true),
      ),
    });
    if (!webhook) return;

    const organizationId = ctx.organizationId;
    const agentConfig = await resolveAgentConfig(organizationId);

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
    const model = createOpenRouterModel(
      agentConfig.model,
      agentConfig.orgApiKey,
    );

    const toolContext: WriteToolContext = {
      projectId: ctx.projectId,
      organizationId,
      userId: firstUser.id,
      accessToken: "",
      sessionId: session.id,
    };

    // Build tools using the trigger preset (skips permission checks)
    const aiTools = buildTriggerTools(toolContext);

    const instruction = interpolateTemplate(
      webhook.instructionTemplate,
      ctx.eventType,
      ctx.eventPayload,
    );

    const userMessage = `A webhook event "${ctx.eventType}" was received for this project. ${instruction}`;

    const result = await generateText({
      model,
      messages: [{ role: "user", content: userMessage }],
      tools: aiTools,
      system: systemPrompt,
      stopWhen: stepCountIs(agentConfig.maxIterations),
    });

    const allMessages = [
      { role: "user" as const, content: userMessage },
      ...(result.text
        ? [{ role: "assistant" as const, content: result.text }]
        : []),
    ];

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
    });
  } catch (err) {
    console.error("[AI Webhook] Error:", {
      webhookId: ctx.webhookId,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}
