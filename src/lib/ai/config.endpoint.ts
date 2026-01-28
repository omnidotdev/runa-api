/**
 * Agent configuration REST endpoint.
 *
 * GET  /api/ai/config?organizationId=xxx — Retrieve org agent config (or defaults)
 * PUT  /api/ai/config                    — Upsert org agent config
 *
 * Uses the same authentication as the chat endpoint.
 */

import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { dbPool } from "lib/db/db";
import { agentConfigs } from "lib/db/schema";
import { isAgentEnabled } from "lib/flags";
import { authenticateRequest } from "./auth";
import { getAllowedModels } from "./config";
import { decrypt, encrypt, maskApiKey } from "./encryption";

import type { AuthenticatedUser } from "./auth";

const aiConfigRoutes = new Elysia({ prefix: "/api/ai/config" })
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

      // Verify user belongs to the requested organization
      const hasAccess = auth.organizations.some(
        (org) => org.id === query.organizationId,
      );
      if (!hasAccess) {
        set.status = 403;
        return { error: "Access denied to this organization" };
      }

      const config = await dbPool.query.agentConfigs.findFirst({
        where: (table, { eq }) =>
          eq(table.organizationId, query.organizationId),
      });

      // Derive masked BYOK key for display (never expose the actual key)
      let byokKey: { maskedKey: string } | null = null;
      if (config?.encryptedApiKey) {
        try {
          const plainKey = decrypt(config.encryptedApiKey);
          byokKey = {
            maskedKey: maskApiKey(plainKey),
          };
        } catch {
          // Decryption failed — key is stale. Show as unavailable.
        }
      }

      // Return config or defaults
      return {
        config: {
          model: config?.model ?? "anthropic/claude-sonnet-4.5",
          requireApprovalForDestructive:
            config?.requireApprovalForDestructive ?? true,
          requireApprovalForCreate: config?.requireApprovalForCreate ?? false,
          maxIterationsPerRequest: config?.maxIterationsPerRequest ?? 10,
          customInstructions: config?.customInstructions ?? null,
          byokKey,
        },
        allowedModels: getAllowedModels(),
      };
    },
    {
      query: t.Object({
        organizationId: t.String(),
      }),
    },
  )
  .put(
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

      // Verify user is an admin/owner of the organization
      const orgClaim = auth.organizations.find(
        (org) => org.id === body.organizationId,
      );
      if (!orgClaim) {
        set.status = 403;
        return { error: "Access denied to this organization" };
      }
      const isAdmin =
        orgClaim.roles.includes("admin") || orgClaim.roles.includes("owner");
      if (!isAdmin) {
        set.status = 403;
        return {
          error: "Only organization admins can update agent configuration",
        };
      }

      // Validate model if provided
      if (body.model !== undefined) {
        const allowedModels = getAllowedModels();
        if (!allowedModels.includes(body.model)) {
          set.status = 400;
          return {
            error: `Invalid model: ${body.model}. Allowed models: ${allowedModels.join(", ")}`,
          };
        }
      }

      // Upsert the config using organizationId as the unique key
      // Validate and clamp maxIterationsPerRequest server-side
      const clampedIterations =
        body.maxIterationsPerRequest !== undefined
          ? Math.max(1, Math.min(20, body.maxIterationsPerRequest))
          : undefined;

      // Truncate customInstructions to prevent prompt bloat
      const sanitizedInstructions =
        body.customInstructions !== undefined
          ? body.customInstructions === null
            ? null
            : body.customInstructions.slice(0, 2000)
          : undefined;

      // Validate defaultPersonaId if provided
      if (
        body.defaultPersonaId !== undefined &&
        body.defaultPersonaId !== null
      ) {
        const persona = await dbPool.query.agentPersonas.findFirst({
          where: (table, { eq: eqFn, and: andFn }) =>
            andFn(
              eqFn(table.id, body.defaultPersonaId!),
              eqFn(table.organizationId, body.organizationId),
            ),
        });
        if (!persona) {
          set.status = 400;
          return { error: "Persona not found in this organization" };
        }
      }

      const values = {
        organizationId: body.organizationId,
        ...(body.model !== undefined && {
          model: body.model,
        }),
        ...(body.requireApprovalForDestructive !== undefined && {
          requireApprovalForDestructive: body.requireApprovalForDestructive,
        }),
        ...(body.requireApprovalForCreate !== undefined && {
          requireApprovalForCreate: body.requireApprovalForCreate,
        }),
        ...(clampedIterations !== undefined && {
          maxIterationsPerRequest: clampedIterations,
        }),
        ...(sanitizedInstructions !== undefined && {
          customInstructions: sanitizedInstructions,
        }),
        ...(body.defaultPersonaId !== undefined && {
          defaultPersonaId: body.defaultPersonaId,
        }),
      };

      const [upserted] = await dbPool
        .insert(agentConfigs)
        .values(values)
        .onConflictDoUpdate({
          target: agentConfigs.organizationId,
          set: {
            ...values,
            updatedAt: new Date().toISOString(),
          },
        })
        .returning({
          model: agentConfigs.model,
          requireApprovalForDestructive:
            agentConfigs.requireApprovalForDestructive,
          requireApprovalForCreate: agentConfigs.requireApprovalForCreate,
          maxIterationsPerRequest: agentConfigs.maxIterationsPerRequest,
          customInstructions: agentConfigs.customInstructions,
          defaultPersonaId: agentConfigs.defaultPersonaId,
        });

      return { config: upserted };
    },
    {
      body: t.Object({
        organizationId: t.String(),
        model: t.Optional(t.String()),
        requireApprovalForDestructive: t.Optional(t.Boolean()),
        requireApprovalForCreate: t.Optional(t.Boolean()),
        maxIterationsPerRequest: t.Optional(t.Number()),
        customInstructions: t.Optional(t.Union([t.String(), t.Null()])),
        defaultPersonaId: t.Optional(t.Union([t.String(), t.Null()])),
      }),
    },
  );

/**
 * BYOK key management routes.
 *
 * PUT    /api/ai/config/key — Store an encrypted OpenRouter API key
 * DELETE /api/ai/config/key — Remove an org API key (revert to server env var)
 */
const aiConfigKeyRoutes = new Elysia({ prefix: "/api/ai/config/key" })
  .put(
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

      const orgClaim = auth.organizations.find(
        (org) => org.id === body.organizationId,
      );
      if (!orgClaim) {
        set.status = 403;
        return { error: "Access denied to this organization" };
      }
      const isAdmin =
        orgClaim.roles.includes("admin") || orgClaim.roles.includes("owner");
      if (!isAdmin) {
        set.status = 403;
        return {
          error: "Only organization admins can manage API keys",
        };
      }

      // Basic key format validation
      if (body.apiKey.length < 10 || body.apiKey.length > 500) {
        set.status = 400;
        return { error: "API key must be between 10 and 500 characters" };
      }

      const encryptedKey = encrypt(body.apiKey);

      // Upsert encrypted key into agent config
      await dbPool
        .insert(agentConfigs)
        .values({
          organizationId: body.organizationId,
          encryptedApiKey: encryptedKey,
        })
        .onConflictDoUpdate({
          target: agentConfigs.organizationId,
          set: {
            encryptedApiKey: encryptedKey,
            updatedAt: new Date().toISOString(),
          },
        });

      return {
        key: {
          maskedKey: maskApiKey(body.apiKey),
        },
      };
    },
    {
      body: t.Object({
        organizationId: t.String(),
        apiKey: t.String(),
      }),
    },
  )
  .delete(
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

      const orgClaim = auth.organizations.find(
        (org) => org.id === body.organizationId,
      );
      if (!orgClaim) {
        set.status = 403;
        return { error: "Access denied to this organization" };
      }
      const isAdmin =
        orgClaim.roles.includes("admin") || orgClaim.roles.includes("owner");
      if (!isAdmin) {
        set.status = 403;
        return {
          error: "Only organization admins can manage API keys",
        };
      }

      // Clear the encrypted key
      await dbPool
        .update(agentConfigs)
        .set({
          encryptedApiKey: null,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(agentConfigs.organizationId, body.organizationId));

      return { success: true };
    },
    {
      body: t.Object({
        organizationId: t.String(),
      }),
    },
  );

export default aiConfigRoutes;
export { aiConfigKeyRoutes };
