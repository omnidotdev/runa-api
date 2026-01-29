/**
 * Scheduled agent run system.
 *
 * Uses croner to run a DB-polled background interval that checks for
 * schedules where `enabled = true AND next_run_at <= NOW()`, then triggers
 * a scoped agent session for each due schedule.
 */

import { generateText, stepCountIs } from "ai";
import { Cron } from "croner";
import { and, eq, lte, sql } from "drizzle-orm";

import { dbPool } from "lib/db/db";
import {
  agentPersonas,
  agentSchedules,
  userOrganizations,
} from "lib/db/schema";
import { isAgentEnabled } from "lib/flags";
import { resolveAgentConfig } from "../config";
import { buildProjectContext } from "../prompts/projectContext";
import { buildSystemPrompt } from "../prompts/system";
import { createOpenRouterModel } from "../provider";
import { createSession, saveSessionMessages } from "../session/manager";
import { buildTriggerTools } from "../tools";

import type { SelectAgentSchedule } from "lib/db/schema/agentSchedule.table";
import type { WriteToolContext } from "../tools";

// ─────────────────────────────────────────────
// Concurrency Guard
// ─────────────────────────────────────────────

const runningSchedules = new Set<string>();

// ─────────────────────────────────────────────
// Next Run Computation
// ─────────────────────────────────────────────

export function computeNextRun(cronExpression: string): Date | null {
  try {
    const job = new Cron(cronExpression);
    return job.nextRun();
  } catch {
    return null;
  }
}

export function isValidCron(cronExpression: string): boolean {
  try {
    new Cron(cronExpression);
    return true;
  } catch {
    return false;
  }
}

const MIN_INTERVAL_MS = 5 * 60 * 1_000;

export function isMinimumInterval(cronExpression: string): boolean {
  try {
    const job = new Cron(cronExpression);
    const first = job.nextRun();
    if (!first) return false;
    const second = job.nextRun(first);
    if (!second) return true;
    return second.getTime() - first.getTime() >= MIN_INTERVAL_MS;
  } catch {
    return false;
  }
}

// ─────────────────────────────────────────────
// Schedule Execution
// ─────────────────────────────────────────────

async function executeSchedule(schedule: SelectAgentSchedule): Promise<void> {
  const organizationId = schedule.organizationId;
  const agentConfig = await resolveAgentConfig(organizationId);

  const orgMembership = await dbPool.query.userOrganizations.findFirst({
    where: eq(userOrganizations.organizationId, organizationId),
    columns: { userId: true },
    with: { user: { columns: { id: true, name: true } } },
  });
  if (!orgMembership?.user) return;

  const user = orgMembership.user;

  const session = await createSession({
    organizationId,
    projectId: schedule.projectId,
    userId: user.id,
    title: `Schedule: ${schedule.name}`,
  });

  let persona = agentConfig.defaultPersona;
  if (schedule.personaId) {
    const schedulePersona = await dbPool.query.agentPersonas.findFirst({
      where: and(
        eq(agentPersonas.id, schedule.personaId),
        eq(agentPersonas.organizationId, organizationId),
        eq(agentPersonas.enabled, true),
      ),
    });
    if (schedulePersona) {
      persona = schedulePersona;
    }
  }

  const projectContext = await buildProjectContext({
    projectId: schedule.projectId,
    organizationId,
    userId: user.id,
    userName: "Scheduled Agent",
    customInstructions: agentConfig.customInstructions,
  });

  const systemPrompt = buildSystemPrompt(projectContext, persona);
  const model = createOpenRouterModel(agentConfig.model, agentConfig.orgApiKey);

  const toolContext: WriteToolContext = {
    projectId: schedule.projectId,
    organizationId,
    userId: user.id,
    accessToken: "",
    sessionId: session.id,
  };

  // Build tools using the trigger preset (skips permission checks)
  const aiTools = buildTriggerTools(toolContext);

  const userMessage = `This is a scheduled run for "${schedule.name}". ${schedule.instruction}`;

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
}

// ─────────────────────────────────────────────
// DB Polling
// ─────────────────────────────────────────────

export async function pollSchedules(): Promise<void> {
  try {
    const enabled = await isAgentEnabled();
    if (!enabled) return;

    const claimedSchedules = await dbPool
      .update(agentSchedules)
      .set({
        lastRunAt: sql`now()`,
        nextRunAt: null,
        updatedAt: sql`now()`,
      })
      .where(
        and(
          eq(agentSchedules.enabled, true),
          lte(agentSchedules.nextRunAt, sql`now()`),
        ),
      )
      .returning();

    if (claimedSchedules.length === 0) return;

    console.info(
      `[AI Scheduler] Claimed ${claimedSchedules.length} due schedule(s)`,
    );

    for (const schedule of claimedSchedules) {
      if (runningSchedules.has(schedule.id)) {
        const nextRun = computeNextRun(schedule.cronExpression);
        dbPool
          .update(agentSchedules)
          .set({ nextRunAt: nextRun, updatedAt: sql`now()` })
          .where(eq(agentSchedules.id, schedule.id))
          .catch(() => {});
        continue;
      }

      runningSchedules.add(schedule.id);

      executeSchedule(schedule)
        .then(() => {
          console.info("[AI Scheduler] Completed:", {
            scheduleId: schedule.id,
            name: schedule.name,
          });
        })
        .catch((err) => {
          console.error("[AI Scheduler] Execution failed:", {
            scheduleId: schedule.id,
            error: err instanceof Error ? err.message : String(err),
          });
        })
        .finally(() => {
          runningSchedules.delete(schedule.id);
          const nextRun = computeNextRun(schedule.cronExpression);
          dbPool
            .update(agentSchedules)
            .set({ nextRunAt: nextRun, updatedAt: sql`now()` })
            .where(eq(agentSchedules.id, schedule.id))
            .catch(() => {});
        });
    }
  } catch (err) {
    console.error(
      "[AI Scheduler] Poll error:",
      err instanceof Error ? err.message : String(err),
    );
  }
}

// ─────────────────────────────────────────────
// Manual Trigger
// ─────────────────────────────────────────────

export async function executeScheduleById(scheduleId: string): Promise<void> {
  if (runningSchedules.has(scheduleId)) {
    throw new Error(`Schedule ${scheduleId} is already running`);
  }

  runningSchedules.add(scheduleId);
  try {
    const schedule = await dbPool.query.agentSchedules.findFirst({
      where: eq(agentSchedules.id, scheduleId),
    });

    if (!schedule) {
      throw new Error(`Schedule ${scheduleId} not found`);
    }

    await dbPool
      .update(agentSchedules)
      .set({ lastRunAt: new Date(), updatedAt: sql`now()` })
      .where(eq(agentSchedules.id, scheduleId));

    await executeSchedule(schedule);

    console.info("[AI Scheduler] Manual run completed:", {
      scheduleId,
      name: schedule.name,
    });
  } finally {
    runningSchedules.delete(scheduleId);
  }
}
