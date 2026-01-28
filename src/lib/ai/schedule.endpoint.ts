/**
 * Agent schedule REST endpoints.
 *
 * CRUD (authenticated, admin-only):
 *  GET    /api/ai/schedules?projectId=xxx — List schedules for a project
 *  POST   /api/ai/schedules              — Create a schedule
 *  PUT    /api/ai/schedules/:id          — Update a schedule
 *  DELETE /api/ai/schedules/:id          — Delete a schedule
 *  POST   /api/ai/schedules/:id/run      — Manually trigger a schedule
 *
 * Cron plugin (background):
 *  Polls the database every 60 seconds for due schedules.
 */

import { cron } from "@elysiajs/cron";
import { and, eq, sql } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { dbPool } from "lib/db/db";
import { agentSchedules } from "lib/db/schema";
import { isAgentEnabled } from "lib/flags";

import { authenticateRequest, validateProjectAccess } from "./auth";
import {
  computeNextRun,
  isMinimumInterval,
  isValidCron,
  pollSchedules,
} from "./triggers/scheduler";

/** Max instruction length. */
const MAX_INSTRUCTION_LENGTH = 4_000;

/** Max schedule name length. */
const MAX_NAME_LENGTH = 100;

/** Max schedules per project. */
const MAX_SCHEDULES_PER_PROJECT = 20;

// ─────────────────────────────────────────────
// Cron Plugin (background polling)
// ─────────────────────────────────────────────

/**
 * Elysia plugin that registers a background cron job polling every 60 seconds
 * for due agent schedules. Uses @elysiajs/cron which wraps the croner library.
 */
const aiScheduleCronPlugin = new Elysia().use(
  cron({
    name: "agent-schedule-poll",
    pattern: "* * * * *", // Every minute
    run: pollSchedules,
  }),
);

// ─────────────────────────────────────────────
// CRUD Endpoints (Authenticated)
// ─────────────────────────────────────────────

const aiScheduleRoutes = new Elysia({ prefix: "/api/ai/schedules" })
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

      try {
        await validateProjectAccess(query.projectId, auth.organizations);
      } catch (err) {
        set.status = 403;
        return {
          error: err instanceof Error ? err.message : "Access denied",
        };
      }

      const schedules = await dbPool.query.agentSchedules.findMany({
        where: eq(agentSchedules.projectId, query.projectId),
        columns: {
          id: true,
          name: true,
          cronExpression: true,
          instruction: true,
          personaId: true,
          enabled: true,
          lastRunAt: true,
          nextRunAt: true,
          createdAt: true,
        },
        orderBy: (table, { desc }) => desc(table.createdAt),
      });

      return { schedules };
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
        orgClaim?.roles.includes("admin") ||
        orgClaim?.roles.includes("owner");
      if (!isAdmin) {
        set.status = 403;
        return {
          error: "Only organization admins can manage schedules",
        };
      }

      // Validate cron expression
      if (!isValidCron(body.cronExpression)) {
        set.status = 400;
        return { error: "Invalid cron expression" };
      }

      // Enforce minimum interval (5 minutes) to prevent resource exhaustion
      if (!isMinimumInterval(body.cronExpression)) {
        set.status = 400;
        return {
          error:
            "Schedule interval too frequent. Minimum interval is 5 minutes.",
        };
      }

      const name = body.name.trim().slice(0, MAX_NAME_LENGTH);
      if (!name) {
        set.status = 400;
        return { error: "Schedule name is required" };
      }

      const instruction = body.instruction
        .trim()
        .slice(0, MAX_INSTRUCTION_LENGTH);
      if (!instruction) {
        set.status = 400;
        return { error: "Instruction is required" };
      }

      // Check schedule cap per project (efficient COUNT query)
      const [{ count: scheduleCount }] = await dbPool
        .select({ count: sql<number>`count(*)::int` })
        .from(agentSchedules)
        .where(eq(agentSchedules.projectId, body.projectId));
      if (scheduleCount >= MAX_SCHEDULES_PER_PROJECT) {
        set.status = 400;
        return {
          error: `Maximum of ${MAX_SCHEDULES_PER_PROJECT} schedules per project reached`,
        };
      }

      // Compute initial nextRunAt
      const nextRunAt = computeNextRun(body.cronExpression);

      const [schedule] = await dbPool
        .insert(agentSchedules)
        .values({
          organizationId,
          projectId: body.projectId,
          name,
          cronExpression: body.cronExpression,
          instruction,
          personaId: body.personaId ?? null,
          enabled: body.enabled ?? true,
          nextRunAt,
        })
        .returning();

      set.status = 201;
      return {
        schedule: {
          id: schedule.id,
          name: schedule.name,
          cronExpression: schedule.cronExpression,
          instruction: schedule.instruction,
          personaId: schedule.personaId,
          enabled: schedule.enabled,
          nextRunAt: schedule.nextRunAt,
          createdAt: schedule.createdAt,
        },
      };
    },
    {
      body: t.Object({
        projectId: t.String(),
        name: t.String(),
        cronExpression: t.String(),
        instruction: t.String(),
        personaId: t.Optional(t.String()),
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
        orgClaim?.roles.includes("admin") ||
        orgClaim?.roles.includes("owner");
      if (!isAdmin) {
        set.status = 403;
        return {
          error: "Only organization admins can manage schedules",
        };
      }

      // Verify schedule exists and belongs to the project
      const existing = await dbPool.query.agentSchedules.findFirst({
        where: and(
          eq(agentSchedules.id, params.id),
          eq(agentSchedules.projectId, body.projectId),
        ),
      });
      if (!existing) {
        set.status = 404;
        return { error: "Schedule not found" };
      }

      const updates: Record<string, unknown> = {
        updatedAt: sql`now()`,
      };

      if (body.name !== undefined) {
        const name = body.name.trim().slice(0, MAX_NAME_LENGTH);
        if (!name) {
          set.status = 400;
          return { error: "Schedule name cannot be empty" };
        }
        updates.name = name;
      }

      if (body.cronExpression !== undefined) {
        if (!isValidCron(body.cronExpression)) {
          set.status = 400;
          return { error: "Invalid cron expression" };
        }
        if (!isMinimumInterval(body.cronExpression)) {
          set.status = 400;
          return {
            error:
              "Schedule interval too frequent. Minimum interval is 5 minutes.",
          };
        }
        updates.cronExpression = body.cronExpression;
        // Recompute next run when cron changes
        updates.nextRunAt = computeNextRun(body.cronExpression);
      }

      if (body.instruction !== undefined) {
        const instruction = body.instruction
          .trim()
          .slice(0, MAX_INSTRUCTION_LENGTH);
        if (!instruction) {
          set.status = 400;
          return { error: "Instruction cannot be empty" };
        }
        updates.instruction = instruction;
      }

      if (body.personaId !== undefined) {
        updates.personaId = body.personaId || null;
      }

      if (body.enabled !== undefined) {
        updates.enabled = body.enabled;
        // Recompute next run when re-enabled
        if (body.enabled) {
          const cronExpr =
            (updates.cronExpression as string) ?? existing.cronExpression;
          updates.nextRunAt = computeNextRun(cronExpr);
        }
      }

      const [updated] = await dbPool
        .update(agentSchedules)
        .set(updates)
        .where(
          and(
            eq(agentSchedules.id, params.id),
            eq(agentSchedules.projectId, body.projectId),
          ),
        )
        .returning({
          id: agentSchedules.id,
          name: agentSchedules.name,
          cronExpression: agentSchedules.cronExpression,
          instruction: agentSchedules.instruction,
          personaId: agentSchedules.personaId,
          enabled: agentSchedules.enabled,
          lastRunAt: agentSchedules.lastRunAt,
          nextRunAt: agentSchedules.nextRunAt,
        });

      return { schedule: updated };
    },
    {
      params: t.Object({ id: t.String() }),
      body: t.Object({
        projectId: t.String(),
        name: t.Optional(t.String()),
        cronExpression: t.Optional(t.String()),
        instruction: t.Optional(t.String()),
        personaId: t.Optional(t.String()),
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
        orgClaim?.roles.includes("admin") ||
        orgClaim?.roles.includes("owner");
      if (!isAdmin) {
        set.status = 403;
        return {
          error: "Only organization admins can manage schedules",
        };
      }

      const deleted = await dbPool
        .delete(agentSchedules)
        .where(
          and(
            eq(agentSchedules.id, params.id),
            eq(agentSchedules.projectId, query.projectId),
          ),
        )
        .returning({ id: agentSchedules.id });

      if (deleted.length === 0) {
        set.status = 404;
        return { error: "Schedule not found" };
      }

      return { success: true };
    },
    {
      params: t.Object({ id: t.String() }),
      query: t.Object({
        projectId: t.String(),
      }),
    },
  )
  .post(
    "/:id/run",
    async ({ request, params, body, set }) => {
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
        orgClaim?.roles.includes("admin") ||
        orgClaim?.roles.includes("owner");
      if (!isAdmin) {
        set.status = 403;
        return {
          error: "Only organization admins can trigger schedules",
        };
      }

      const schedule = await dbPool.query.agentSchedules.findFirst({
        where: and(
          eq(agentSchedules.id, params.id),
          eq(agentSchedules.projectId, body.projectId),
        ),
      });

      if (!schedule) {
        set.status = 404;
        return { error: "Schedule not found" };
      }

      // Import dynamically to avoid circular dependency at module scope
      const { executeScheduleById } = await import("./triggers/scheduler");
      executeScheduleById(schedule.id).catch((err) => {
        // biome-ignore lint/suspicious/noConsole: fire-and-forget error logging
        console.error(
          "[AI Schedule] Manual run failed:",
          err instanceof Error ? err.message : String(err),
        );
      });

      return { triggered: true };
    },
    {
      params: t.Object({ id: t.String() }),
      body: t.Object({
        projectId: t.String(),
      }),
    },
  );

export default aiScheduleRoutes;
export { aiScheduleCronPlugin };
