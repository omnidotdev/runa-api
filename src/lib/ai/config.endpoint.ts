/**
 * Agent configuration REST endpoint.
 *
 * GET  /api/ai/config?organizationId=xxx — Retrieve org agent config (or defaults)
 * PUT  /api/ai/config                    — Upsert org agent config
 *
 * Uses the same authentication as the chat endpoint.
 */

import { Elysia, t } from "elysia";

import { dbPool } from "lib/db/db";
import { agentConfigs } from "lib/db/schema";
import { isAgentEnabled } from "lib/flags";

import { authenticateRequest } from "./auth";

const aiConfigRoutes = new Elysia({ prefix: "/api/ai/config" })
  .get(
    "/",
    async ({ request, query, set }) => {
      const enabled = await isAgentEnabled();
      if (!enabled) {
        set.status = 403;
        return { error: "Agent feature is not enabled" };
      }

      let auth;
      try {
        auth = await authenticateRequest(request);
      } catch (err) {
        set.status = 401;
        return {
          error:
            err instanceof Error ? err.message : "Authentication failed",
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

      // Return config or defaults
      return {
        config: {
          requireApprovalForDestructive:
            config?.requireApprovalForDestructive ?? true,
          requireApprovalForCreate:
            config?.requireApprovalForCreate ?? false,
          maxIterationsPerRequest:
            config?.maxIterationsPerRequest ?? 10,
          customInstructions: config?.customInstructions ?? null,
        },
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

      let auth;
      try {
        auth = await authenticateRequest(request);
      } catch (err) {
        set.status = 401;
        return {
          error:
            err instanceof Error ? err.message : "Authentication failed",
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
          error:
            "Only organization admins can update agent configuration",
        };
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

      const values = {
        organizationId: body.organizationId,
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
          requireApprovalForDestructive:
            agentConfigs.requireApprovalForDestructive,
          requireApprovalForCreate: agentConfigs.requireApprovalForCreate,
          maxIterationsPerRequest: agentConfigs.maxIterationsPerRequest,
          customInstructions: agentConfigs.customInstructions,
        });

      return { config: upserted };
    },
    {
      body: t.Object({
        organizationId: t.String(),
        requireApprovalForDestructive: t.Optional(t.Boolean()),
        requireApprovalForCreate: t.Optional(t.Boolean()),
        maxIterationsPerRequest: t.Optional(t.Number()),
        customInstructions: t.Optional(t.Union([t.String(), t.Null()])),
      }),
    },
  );

export default aiConfigRoutes;
