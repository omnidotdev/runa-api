/**
 * Scheduled agent run system.
 *
 * Uses @elysiajs/cron to run a DB-polled background interval that checks for
 * schedules where `enabled = true AND next_run_at <= NOW()`, then triggers
 * a scoped agent session for each due schedule.
 *
 * After execution, updates `last_run_at` and computes the next `next_run_at`
 * from the cron expression using the `croner` library.
 *
 * Security:
 *  - Destructive tools are excluded (same as webhook/mention-triggered sessions)
 *  - Rate limited per schedule (1 concurrent run) via in-memory lock set
 *  - Activity log records trigger source as "schedule"
 */

import { chat, maxIterations } from "@tanstack/ai";
import { Cron } from "croner";
import { and, eq, lte, sql } from "drizzle-orm";

import { dbPool } from "lib/db/db";
import {
  agentPersonas,
  agentSchedules,
  userOrganizations,
} from "lib/db/schema";
import { isAgentEnabled } from "lib/flags";

import { createAdapter, resolveAgentConfig } from "../config";
import { buildProjectContext } from "../prompts/projectContext";
import { buildSystemPrompt } from "../prompts/system";
import { createSession, saveSessionMessages } from "../session/manager";
import { createQueryTools, createWriteTools } from "../tools/server";

import type { StreamChunk } from "@tanstack/ai";
import type { SelectAgentSchedule } from "lib/db/schema/agentSchedule.table";

// ─────────────────────────────────────────────
// Concurrency Guard
// ─────────────────────────────────────────────

/**
 * In-memory set of schedule IDs currently being executed.
 * Prevents overlapping runs if a schedule takes longer than the poll interval.
 */
const runningSchedules = new Set<string>();

// ─────────────────────────────────────────────
// Next Run Computation
// ─────────────────────────────────────────────

/**
 * Compute the next run date from a cron expression.
 * Returns `null` if the expression is invalid or has no future occurrences.
 */
export function computeNextRun(cronExpression: string): Date | null {
  try {
    const job = new Cron(cronExpression);
    const next = job.nextRun();
    return next;
  } catch {
    return null;
  }
}

/**
 * Validate a cron expression. Returns true if parseable by croner.
 */
export function isValidCron(cronExpression: string): boolean {
  try {
    new Cron(cronExpression);
    return true;
  } catch {
    return false;
  }
}

/** Minimum interval between scheduled runs (5 minutes). */
const MIN_INTERVAL_MS = 5 * 60 * 1_000;

/**
 * Check that a cron expression doesn't schedule runs more frequently than
 * the minimum interval. Prevents resource exhaustion from high-frequency
 * schedules that each trigger full LLM agent sessions.
 *
 * Returns `false` if the interval between the next two runs is below 5 minutes.
 */
export function isMinimumInterval(cronExpression: string): boolean {
  try {
    const job = new Cron(cronExpression);
    const first = job.nextRun();
    if (!first) return false;
    const second = job.nextRun(first);
    if (!second) return true; // One-shot cron — always acceptable
    return second.getTime() - first.getTime() >= MIN_INTERVAL_MS;
  } catch {
    return false;
  }
}

// ─────────────────────────────────────────────
// Schedule Execution
// ─────────────────────────────────────────────

/**
 * Execute a single scheduled agent run.
 *
 * Runs a scoped agent session with the schedule's instruction, optionally
 * using the configured persona for the system prompt.
 */
async function executeSchedule(schedule: SelectAgentSchedule): Promise<void> {
  const organizationId = schedule.organizationId;

  // 1. Resolve agent config
  const agentConfig = await resolveAgentConfig(organizationId);
  const { orgApiKey, ...safeConfig } = agentConfig;

  const adapter = createAdapter(
    safeConfig.provider,
    safeConfig.model,
    orgApiKey,
  );

  // 2. Find a user in this organization for FK constraints
  const orgMembership = await dbPool.query.userOrganizations.findFirst({
    where: eq(userOrganizations.organizationId, organizationId),
    columns: { userId: true },
    with: { user: { columns: { id: true, name: true } } },
  });
  if (!orgMembership?.user) return;

  const user = orgMembership.user;

  // 3. Create session for audit trail
  const session = await createSession({
    organizationId,
    projectId: schedule.projectId,
    userId: user.id,
    title: `Schedule: ${schedule.name}`,
  });

  // 4. Optionally load persona for system prompt override
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

  // 5. Build system prompt
  const projectContext = await buildProjectContext({
    projectId: schedule.projectId,
    organizationId,
    userId: user.id,
    userName: "Scheduled Agent",
    customInstructions: agentConfig.customInstructions,
  });

  const systemPrompt = buildSystemPrompt(projectContext, persona);

  // 6. Build tools — no destructive tools for scheduled sessions
  const writeContext = {
    projectId: schedule.projectId,
    organizationId,
    userId: user.id,
    accessToken: "", // Scheduled runs don't have a user access token
    sessionId: session.id,
  };

  const { queryTasks, queryProject, getTask } = createQueryTools({
    projectId: schedule.projectId,
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

  // 7. Run agent tool loop
  const userMessage = `This is a scheduled run for "${schedule.name}". ${schedule.instruction}`;

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

  // 8. Persist session
  await saveSessionMessages(session.id, allMessages);
}

// ─────────────────────────────────────────────
// DB Polling
// ─────────────────────────────────────────────

/**
 * Poll the database for due schedules and execute them.
 *
 * This function is called by the @elysiajs/cron plugin on a fixed interval.
 *
 * Uses an atomic UPDATE...RETURNING to claim due schedules. This prevents
 * multi-instance race conditions: even if multiple API instances poll
 * simultaneously, each schedule row is only returned by one UPDATE.
 * The claim sets `nextRunAt = NULL` as a sentinel, which is recomputed
 * after execution.
 */
export async function pollSchedules(): Promise<void> {
  try {
    const enabled = await isAgentEnabled();
    if (!enabled) return;

    // Atomically claim all due schedules by setting nextRunAt = NULL
    // and lastRunAt = NOW(). RETURNING gives us the full row data for
    // execution. Multi-instance safe: only one instance gets each row.
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

    // biome-ignore lint/suspicious/noConsole: scheduler metrics
    console.info(
      `[AI Scheduler] Claimed ${claimedSchedules.length} due schedule(s)`,
    );

    // Execute each claimed schedule (fire-and-forget with concurrency guard)
    for (const schedule of claimedSchedules) {
      if (runningSchedules.has(schedule.id)) {
        // biome-ignore lint/suspicious/noConsole: scheduler metrics
        console.info(
          `[AI Scheduler] Skipping ${schedule.id} — already running`,
        );
        // Re-set nextRunAt since we cleared it during the claim
        const nextRun = computeNextRun(schedule.cronExpression);
        dbPool
          .update(agentSchedules)
          .set({ nextRunAt: nextRun, updatedAt: sql`now()` })
          .where(eq(agentSchedules.id, schedule.id))
          .catch(() => {});
        continue;
      }

      runningSchedules.add(schedule.id);

      // Execute the schedule asynchronously, then recompute nextRunAt
      executeSchedule(schedule)
        .then(() => {
          // biome-ignore lint/suspicious/noConsole: scheduler metrics
          console.info("[AI Scheduler] Completed:", {
            scheduleId: schedule.id,
            name: schedule.name,
            projectId: schedule.projectId,
          });
        })
        .catch((err) => {
          // biome-ignore lint/suspicious/noConsole: error logging
          console.error("[AI Scheduler] Execution failed:", {
            scheduleId: schedule.id,
            error: err instanceof Error ? err.message : String(err),
          });
        })
        .finally(() => {
          runningSchedules.delete(schedule.id);

          // Recompute and persist nextRunAt after execution completes
          const nextRun = computeNextRun(schedule.cronExpression);
          dbPool
            .update(agentSchedules)
            .set({ nextRunAt: nextRun, updatedAt: sql`now()` })
            .where(eq(agentSchedules.id, schedule.id))
            .catch((err) => {
              // biome-ignore lint/suspicious/noConsole: error logging
              console.error("[AI Scheduler] Failed to set nextRunAt:", {
                scheduleId: schedule.id,
                error: err instanceof Error ? err.message : String(err),
              });
            });
        });
    }
  } catch (err) {
    // biome-ignore lint/suspicious/noConsole: error logging
    console.error(
      "[AI Scheduler] Poll error:",
      err instanceof Error ? err.message : String(err),
    );
  }
}

// ─────────────────────────────────────────────
// Manual Trigger (Run Now)
// ─────────────────────────────────────────────

/**
 * Manually trigger a schedule by ID.
 * Used by the "Run Now" endpoint for on-demand execution.
 *
 * Respects the same concurrency guard as `pollSchedules` to prevent
 * overlapping runs from manual + scheduled execution.
 */
export async function executeScheduleById(
  scheduleId: string,
): Promise<void> {
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

    // Update lastRunAt for manual runs
    await dbPool
      .update(agentSchedules)
      .set({ lastRunAt: new Date(), updatedAt: sql`now()` })
      .where(eq(agentSchedules.id, scheduleId));

    await executeSchedule(schedule);

    // biome-ignore lint/suspicious/noConsole: manual trigger logging
    console.info("[AI Scheduler] Manual run completed:", {
      scheduleId,
      name: schedule.name,
    });
  } finally {
    runningSchedules.delete(scheduleId);
  }
}
