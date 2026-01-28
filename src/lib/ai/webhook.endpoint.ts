/**
 * Agent webhook REST endpoints.
 *
 * CRUD (authenticated, admin-only):
 *  GET    /api/ai/webhooks?projectId=xxx — List webhooks for a project
 *  POST   /api/ai/webhooks              — Create a webhook (returns signing secret once)
 *  PUT    /api/ai/webhooks/:id          — Update a webhook
 *  DELETE /api/ai/webhooks/:id          — Delete a webhook
 *
 * Receiver (HMAC-verified, no auth):
 *  POST   /api/ai/webhook/:projectId/:webhookId — Receive external events
 */

import { and, eq } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { dbPool } from "lib/db/db";
import { agentWebhooks } from "lib/db/schema";
import { isAgentEnabled } from "lib/flags";
import { authenticateRequest, validateProjectAccess } from "./auth";
import { encrypt } from "./encryption";
import {
  WEBHOOK_EVENT_TYPES,
  generateSigningSecret,
  handleWebhook,
  verifyWebhookSignature,
} from "./triggers/webhook";

import type { AuthenticatedUser } from "./auth";

/** Max instruction template length. */
const MAX_TEMPLATE_LENGTH = 4_000;

/** Max webhook name length. */
const MAX_NAME_LENGTH = 100;

/** Max webhooks per project (prevents unbounded resource growth). */
const MAX_WEBHOOKS_PER_PROJECT = 10;

/** Max receiver payload size in bytes (256 KB). */
const MAX_PAYLOAD_SIZE = 256 * 1024;

// ─────────────────────────────────────────────
// CRUD Endpoints (Authenticated)
// ─────────────────────────────────────────────

const aiWebhookRoutes = new Elysia({ prefix: "/api/ai/webhooks" })
  .get(
    "/",
    async ({ request, query, set }) => {
      const enabled = await isAgentEnabled();
      if (!enabled) {
        set.status = 403;
        return { error: "Agent feature is not enabled" };
      }

      let auth: AuthenticatedUser;
      try {
        auth = await authenticateRequest(request);
      } catch (err) {
        set.status = 401;
        return {
          error: err instanceof Error ? err.message : "Authentication failed",
        };
      }

      try {
        await validateProjectAccess(query.projectId, auth.organizations);
      } catch (err) {
        set.status = 403;
        return {
          error: err instanceof Error ? err.message : "Access denied",
        };
      }

      const webhooks = await dbPool.query.agentWebhooks.findMany({
        where: eq(agentWebhooks.projectId, query.projectId),
        columns: {
          id: true,
          name: true,
          eventType: true,
          instructionTemplate: true,
          enabled: true,
          lastTriggeredAt: true,
          createdAt: true,
        },
        orderBy: (table, { desc }) => desc(table.createdAt),
      });

      return { webhooks };
    },
    {
      query: t.Object({
        projectId: t.String(),
      }),
    },
  )
  .post(
    "/",
    async ({ request, body, set }) => {
      const enabled = await isAgentEnabled();
      if (!enabled) {
        set.status = 403;
        return { error: "Agent feature is not enabled" };
      }

      let auth: AuthenticatedUser;
      try {
        auth = await authenticateRequest(request);
      } catch (err) {
        set.status = 401;
        return {
          error: err instanceof Error ? err.message : "Authentication failed",
        };
      }

      let organizationId: string;
      try {
        const access = await validateProjectAccess(
          body.projectId,
          auth.organizations,
        );
        organizationId = access.organizationId;
      } catch (err) {
        set.status = 403;
        return {
          error: err instanceof Error ? err.message : "Access denied",
        };
      }

      // Verify admin role
      const orgClaim = auth.organizations.find(
        (org) => org.id === organizationId,
      );
      const isAdmin =
        orgClaim?.roles.includes("admin") || orgClaim?.roles.includes("owner");
      if (!isAdmin) {
        set.status = 403;
        return {
          error: "Only organization admins can manage webhooks",
        };
      }

      // Validate event type
      if (
        !WEBHOOK_EVENT_TYPES.includes(
          body.eventType as (typeof WEBHOOK_EVENT_TYPES)[number],
        )
      ) {
        set.status = 400;
        return {
          error: `Unsupported event type: ${body.eventType}. Allowed: ${WEBHOOK_EVENT_TYPES.join(", ")}`,
        };
      }

      const name = body.name.trim().slice(0, MAX_NAME_LENGTH);
      if (!name) {
        set.status = 400;
        return { error: "Webhook name is required" };
      }

      const instructionTemplate = body.instructionTemplate
        .trim()
        .slice(0, MAX_TEMPLATE_LENGTH);
      if (!instructionTemplate) {
        set.status = 400;
        return { error: "Instruction template is required" };
      }

      // Check webhook cap per project
      const existingCount = await dbPool.query.agentWebhooks.findMany({
        where: eq(agentWebhooks.projectId, body.projectId),
        columns: { id: true },
      });
      if (existingCount.length >= MAX_WEBHOOKS_PER_PROJECT) {
        set.status = 400;
        return {
          error: `Maximum of ${MAX_WEBHOOKS_PER_PROJECT} webhooks per project reached`,
        };
      }

      // Generate a random signing secret and encrypt at rest
      const plaintextSecret = generateSigningSecret();
      const encryptedSecret = encrypt(plaintextSecret);

      const [webhook] = await dbPool
        .insert(agentWebhooks)
        .values({
          organizationId,
          projectId: body.projectId,
          name,
          eventType: body.eventType,
          instructionTemplate,
          signingSecret: encryptedSecret,
          enabled: body.enabled ?? true,
        })
        .returning();

      set.status = 201;
      return {
        webhook: {
          id: webhook.id,
          name: webhook.name,
          eventType: webhook.eventType,
          instructionTemplate: webhook.instructionTemplate,
          enabled: webhook.enabled,
          createdAt: webhook.createdAt,
        },
        // Return the plaintext secret only on creation — it is encrypted at rest
        // and cannot be retrieved later
        signingSecret: plaintextSecret,
      };
    },
    {
      body: t.Object({
        projectId: t.String(),
        name: t.String(),
        eventType: t.String(),
        instructionTemplate: t.String(),
        enabled: t.Optional(t.Boolean()),
      }),
    },
  )
  .put(
    "/:id",
    async ({ request, params, body, set }) => {
      const enabled = await isAgentEnabled();
      if (!enabled) {
        set.status = 403;
        return { error: "Agent feature is not enabled" };
      }

      let auth: AuthenticatedUser;
      try {
        auth = await authenticateRequest(request);
      } catch (err) {
        set.status = 401;
        return {
          error: err instanceof Error ? err.message : "Authentication failed",
        };
      }

      let organizationId: string;
      try {
        const access = await validateProjectAccess(
          body.projectId,
          auth.organizations,
        );
        organizationId = access.organizationId;
      } catch (err) {
        set.status = 403;
        return {
          error: err instanceof Error ? err.message : "Access denied",
        };
      }

      // Verify admin role
      const orgClaim = auth.organizations.find(
        (org) => org.id === organizationId,
      );
      const isAdmin =
        orgClaim?.roles.includes("admin") || orgClaim?.roles.includes("owner");
      if (!isAdmin) {
        set.status = 403;
        return {
          error: "Only organization admins can manage webhooks",
        };
      }

      // Verify webhook exists and belongs to the project
      const existing = await dbPool.query.agentWebhooks.findFirst({
        where: and(
          eq(agentWebhooks.id, params.id),
          eq(agentWebhooks.projectId, body.projectId),
        ),
      });
      if (!existing) {
        set.status = 404;
        return { error: "Webhook not found" };
      }

      const updates: Record<string, unknown> = {
        updatedAt: new Date().toISOString(),
      };

      if (body.name !== undefined) {
        const name = body.name.trim().slice(0, MAX_NAME_LENGTH);
        if (!name) {
          set.status = 400;
          return { error: "Webhook name cannot be empty" };
        }
        updates.name = name;
      }

      if (body.eventType !== undefined) {
        if (
          !WEBHOOK_EVENT_TYPES.includes(
            body.eventType as (typeof WEBHOOK_EVENT_TYPES)[number],
          )
        ) {
          set.status = 400;
          return {
            error: `Unsupported event type: ${body.eventType}. Allowed: ${WEBHOOK_EVENT_TYPES.join(", ")}`,
          };
        }
        updates.eventType = body.eventType;
      }

      if (body.instructionTemplate !== undefined) {
        const template = body.instructionTemplate
          .trim()
          .slice(0, MAX_TEMPLATE_LENGTH);
        if (!template) {
          set.status = 400;
          return { error: "Instruction template cannot be empty" };
        }
        updates.instructionTemplate = template;
      }

      if (body.enabled !== undefined) {
        updates.enabled = body.enabled;
      }

      const [updated] = await dbPool
        .update(agentWebhooks)
        .set(updates)
        .where(
          and(
            eq(agentWebhooks.id, params.id),
            eq(agentWebhooks.projectId, body.projectId),
          ),
        )
        .returning({
          id: agentWebhooks.id,
          name: agentWebhooks.name,
          eventType: agentWebhooks.eventType,
          instructionTemplate: agentWebhooks.instructionTemplate,
          enabled: agentWebhooks.enabled,
          lastTriggeredAt: agentWebhooks.lastTriggeredAt,
        });

      return { webhook: updated };
    },
    {
      params: t.Object({ id: t.String() }),
      body: t.Object({
        projectId: t.String(),
        name: t.Optional(t.String()),
        eventType: t.Optional(t.String()),
        instructionTemplate: t.Optional(t.String()),
        enabled: t.Optional(t.Boolean()),
      }),
    },
  )
  .delete(
    "/:id",
    async ({ request, params, query, set }) => {
      const enabled = await isAgentEnabled();
      if (!enabled) {
        set.status = 403;
        return { error: "Agent feature is not enabled" };
      }

      let auth: AuthenticatedUser;
      try {
        auth = await authenticateRequest(request);
      } catch (err) {
        set.status = 401;
        return {
          error: err instanceof Error ? err.message : "Authentication failed",
        };
      }

      let organizationId: string;
      try {
        const access = await validateProjectAccess(
          query.projectId,
          auth.organizations,
        );
        organizationId = access.organizationId;
      } catch (err) {
        set.status = 403;
        return {
          error: err instanceof Error ? err.message : "Access denied",
        };
      }

      // Verify admin role
      const orgClaim = auth.organizations.find(
        (org) => org.id === organizationId,
      );
      const isAdmin =
        orgClaim?.roles.includes("admin") || orgClaim?.roles.includes("owner");
      if (!isAdmin) {
        set.status = 403;
        return {
          error: "Only organization admins can manage webhooks",
        };
      }

      const deleted = await dbPool
        .delete(agentWebhooks)
        .where(
          and(
            eq(agentWebhooks.id, params.id),
            eq(agentWebhooks.projectId, query.projectId),
          ),
        )
        .returning({ id: agentWebhooks.id });

      if (deleted.length === 0) {
        set.status = 404;
        return { error: "Webhook not found" };
      }

      return { success: true };
    },
    {
      params: t.Object({ id: t.String() }),
      query: t.Object({
        projectId: t.String(),
      }),
    },
  );

// ─────────────────────────────────────────────
// Receiver Endpoint (HMAC-Verified, No Auth)
// ─────────────────────────────────────────────

/**
 * The receiver route intentionally omits a TypeBox body schema because
 * Elysia would parse the body before we can read the raw text for HMAC
 * verification. We read `request.text()` manually instead.
 */
const aiWebhookReceiverRoutes = new Elysia({
  prefix: "/api/ai/webhook",
}).post(
  "/:projectId/:webhookId",
  async ({ request, params, headers, set }) => {
    // Generic error used for all "not found" / "unauthorized" paths
    // to prevent webhook and project ID enumeration.
    const GENERIC_REJECT = { error: "Webhook verification failed" } as const;

    const enabled = await isAgentEnabled();
    if (!enabled) {
      set.status = 403;
      return { error: "Agent feature is not enabled" };
    }

    const signature = headers["x-webhook-signature"];
    if (!signature) {
      set.status = 401;
      return GENERIC_REJECT;
    }

    try {
      // Enforce payload size limit (256 KB)
      const contentLength = Number(headers["content-length"] ?? "0");
      if (contentLength > MAX_PAYLOAD_SIZE) {
        set.status = 413;
        return { error: "Payload too large" };
      }

      // Load webhook config
      const webhook = await dbPool.query.agentWebhooks.findFirst({
        where: and(
          eq(agentWebhooks.id, params.webhookId),
          eq(agentWebhooks.projectId, params.projectId),
          eq(agentWebhooks.enabled, true),
        ),
      });

      if (!webhook) {
        // Return same error as invalid signature to prevent enumeration
        set.status = 401;
        return GENERIC_REJECT;
      }

      // Read raw body and enforce actual size limit
      const rawBody = await request.text();
      if (rawBody.length > MAX_PAYLOAD_SIZE) {
        set.status = 413;
        return { error: "Payload too large" };
      }

      // Verify HMAC-SHA256 signature (secret is decrypted inside verifyWebhookSignature)
      const isValid = verifyWebhookSignature(
        rawBody,
        signature,
        webhook.signingSecret,
      );

      if (!isValid) {
        set.status = 401;
        return GENERIC_REJECT;
      }

      // Parse payload
      let eventPayload: Record<string, unknown>;
      try {
        eventPayload = JSON.parse(rawBody) as Record<string, unknown>;
      } catch {
        set.status = 400;
        return { error: "Invalid JSON payload" };
      }

      // Determine event type from header or payload or webhook config
      const eventType =
        headers["x-webhook-event"] ??
        (eventPayload.eventType as string | undefined) ??
        webhook.eventType;

      // Fire-and-forget: trigger the agent in the background
      handleWebhook({
        webhookId: webhook.id,
        projectId: params.projectId,
        organizationId: webhook.organizationId,
        eventType,
        eventPayload,
      }).catch((err) => {
        console.error(
          "[AI Webhook] Failed to handle webhook:",
          err instanceof Error ? err.message : String(err),
        );
      });

      set.status = 200;
      return { received: true };
    } catch (err) {
      console.error("[AI Webhook] Receiver error:", err);
      set.status = 500;
      return { error: "Internal server error" };
    }
  },
  {
    params: t.Object({
      projectId: t.String(),
      webhookId: t.String(),
    }),
    headers: t.Object({
      "x-webhook-signature": t.Optional(t.String()),
      "x-webhook-event": t.Optional(t.String()),
      "content-length": t.Optional(t.String()),
    }),
  },
);

export default aiWebhookRoutes;
export { aiWebhookReceiverRoutes };
