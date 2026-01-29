/**
 * Agent rollback REST endpoints.
 *
 * Allows users to undo agent tool executions by reverting to the
 * snapshot captured before the write operation.
 *
 *  POST /api/ai/rollback/:activityId          — Revert a single activity
 *  POST /api/ai/rollback/session/:sessionId   — Revert all activities in a session (reverse order)
 *  POST /api/ai/rollback/by-match             — Revert by matching session + tool name + input
 *
 * Permission: same user who triggered the activity OR organization admin.
 */

import { and, desc, eq, sql } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { dbPool } from "lib/db/db";
import { agentActivities } from "lib/db/schema";
import { isAgentEnabled } from "lib/flags";
import { authenticateRequest, validateProjectAccess } from "./auth";
import { applyRollback } from "./rollback";

import type { AuthenticatedUser } from "./auth";
import type { Snapshot } from "./rollback";

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────

/** Maximum serialized size of toolInput for match queries (10 KB). */
const MAX_TOOL_INPUT_SIZE = 10_000;

/** UUID v4 pattern for parameter validation. */
const UUID_PATTERN =
  "^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$";

// ─────────────────────────────────────────────
// REST Endpoints
// ─────────────────────────────────────────────

const aiRollbackRoutes = new Elysia({ prefix: "/api/ai/rollback" })
  // ── Single activity rollback ───────────────
  .post(
    "/:activityId",
    async ({ request, params, set }) => {
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

      // Fetch the activity record
      const activity = await dbPool.query.agentActivities.findFirst({
        where: eq(agentActivities.id, params.activityId),
      });

      if (!activity) {
        set.status = 404;
        return { error: "Activity not found" };
      }

      // Permission: same user or org admin
      try {
        const { organizationId } = await validateProjectAccess(
          activity.projectId,
          auth.organizations,
        );

        const isSameUser = auth.user.id === activity.userId;
        const orgClaim = auth.organizations.find(
          (org) => org.id === organizationId,
        );
        const isAdmin =
          orgClaim?.roles.includes("admin") ||
          orgClaim?.roles.includes("owner");

        if (!isSameUser && !isAdmin) {
          set.status = 403;
          return {
            error:
              "Only the original user or an organization admin can rollback this activity",
          };
        }
      } catch (err) {
        set.status = 403;
        return {
          error: err instanceof Error ? err.message : "Access denied",
        };
      }

      // Pre-check: must have a snapshot (lightweight check before entering transaction)
      if (!activity.snapshotBefore) {
        set.status = 400;
        return {
          error:
            "This activity does not have a snapshot and cannot be rolled back.",
        };
      }

      // Apply rollback atomically — the transaction-internal UPDATE serves as
      // both a status check and a row lock, preventing TOCTOU double-rollback.
      try {
        const snapshot = activity.snapshotBefore as Snapshot;

        const description = await dbPool.transaction(async (tx) => {
          // Atomically claim: set status to rolled_back only if still completed.
          // This UPDATE acquires a row-level lock, so concurrent requests
          // will serialize here — the second one sees "rolled_back" and gets 0 rows.
          const claimed = await tx
            .update(agentActivities)
            .set({ status: "rolled_back" })
            .where(
              and(
                eq(agentActivities.id, params.activityId),
                eq(agentActivities.status, "completed"),
              ),
            )
            .returning({ id: agentActivities.id });

          if (claimed.length === 0) {
            throw new Error(
              "Activity has already been rolled back or its status changed",
            );
          }

          const desc = await applyRollback(snapshot, tx, activity.projectId);

          // Create a rollback audit entry
          await tx.insert(agentActivities).values({
            organizationId: activity.organizationId,
            projectId: activity.projectId,
            sessionId: activity.sessionId,
            userId: auth.user.id,
            toolName: "rollback",
            toolInput: { activityId: params.activityId },
            toolOutput: { description: desc },
            status: "completed",
            affectedTaskIds: activity.affectedTaskIds,
          });

          return desc;
        });

        return {
          success: true,
          rolledBackActivityId: params.activityId,
          description,
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Rollback failed";
        // Client-actionable errors (double-rollback) get 409 Conflict
        if (message.includes("already been rolled back")) {
          set.status = 409;
        } else {
          set.status = 500;
        }
        return { error: message };
      }
    },
    {
      params: t.Object({
        activityId: t.String({ pattern: UUID_PATTERN }),
      }),
    },
  )
  // ── Session rollback ───────────────────────
  .post(
    "/session/:sessionId",
    async ({ request, params, set }) => {
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

      // Fetch all completed activities for this session with snapshots,
      // ordered by creation time descending (newest first for reverse-order rollback)
      const activities = await dbPool.query.agentActivities.findMany({
        where: and(
          eq(agentActivities.sessionId, params.sessionId),
          eq(agentActivities.status, "completed"),
        ),
        orderBy: desc(agentActivities.createdAt),
      });

      if (activities.length === 0) {
        set.status = 404;
        return {
          error: "No completed activities found for this session",
        };
      }

      // Validate access to ALL unique projects referenced by session activities,
      // not just the first. A session could span multiple projects if the agent
      // operated cross-project.
      const uniqueProjectIds = [...new Set(activities.map((a) => a.projectId))];

      try {
        for (const pid of uniqueProjectIds) {
          const { organizationId } = await validateProjectAccess(
            pid,
            auth.organizations,
          );

          const isSameUser = activities
            .filter((a) => a.projectId === pid)
            .every((a) => a.userId === auth.user.id);
          const orgClaim = auth.organizations.find(
            (org) => org.id === organizationId,
          );
          const isAdmin =
            orgClaim?.roles.includes("admin") ||
            orgClaim?.roles.includes("owner");

          if (!isSameUser && !isAdmin) {
            set.status = 403;
            return {
              error: `Only the original user or an organization admin can rollback activities in project ${pid}`,
            };
          }
        }
      } catch (err) {
        set.status = 403;
        return {
          error: err instanceof Error ? err.message : "Access denied",
        };
      }

      // Filter to activities that have snapshots
      const rollbackable = activities.filter((a) => a.snapshotBefore !== null);

      if (rollbackable.length === 0) {
        set.status = 400;
        return {
          error: "No activities in this session have snapshots for rollback.",
        };
      }

      // Apply all rollbacks in reverse chronological order within a single transaction.
      // Uses atomic UPDATE...WHERE to prevent TOCTOU on each activity.
      try {
        const results = await dbPool.transaction(async (tx) => {
          const descriptions: Array<{
            activityId: string;
            toolName: string;
            description: string;
          }> = [];

          for (const activity of rollbackable) {
            // Atomically claim each activity — skip if concurrently rolled back
            const claimed = await tx
              .update(agentActivities)
              .set({ status: "rolled_back" })
              .where(
                and(
                  eq(agentActivities.id, activity.id),
                  eq(agentActivities.status, "completed"),
                ),
              )
              .returning({ id: agentActivities.id });

            if (claimed.length === 0) continue;

            const snapshot = activity.snapshotBefore as Snapshot;
            const desc = await applyRollback(snapshot, tx, activity.projectId);

            descriptions.push({
              activityId: activity.id,
              toolName: activity.toolName,
              description: desc,
            });
          }

          if (descriptions.length === 0) {
            throw new Error(
              "All activities in this session were already rolled back",
            );
          }

          // Create a single rollback audit entry for the session
          const firstActivity = activities[0];
          await tx.insert(agentActivities).values({
            organizationId: firstActivity.organizationId,
            projectId: firstActivity.projectId,
            sessionId: params.sessionId,
            userId: auth.user.id,
            toolName: "sessionRollback",
            toolInput: { sessionId: params.sessionId },
            toolOutput: { descriptions },
            status: "completed",
            affectedTaskIds: rollbackable.flatMap(
              (a) => (a.affectedTaskIds as string[]) ?? [],
            ),
          });

          return descriptions;
        });

        return {
          success: true,
          sessionId: params.sessionId,
          rolledBackCount: results.length,
          details: results,
        };
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Session rollback failed";
        if (message.includes("already rolled back")) {
          set.status = 409;
        } else {
          set.status = 500;
        }
        return { error: message };
      }
    },
    {
      params: t.Object({
        sessionId: t.String({ pattern: UUID_PATTERN }),
      }),
    },
  )
  // ── Match-based rollback (for chat UI) ─────
  .post(
    "/by-match",
    async ({ request, body, set }) => {
      const enabled = await isAgentEnabled();
      if (!enabled) {
        set.status = 403;
        return { error: "Agent feature is not enabled" };
      }

      // Guard against oversized toolInput payloads before hitting the database.
      // Without this, an attacker could send a multi-MB JSONB value that PostgreSQL
      // must parse and compare, enabling cost-based DoS.
      const toolInputJson = JSON.stringify(body.toolInput);
      if (toolInputJson.length > MAX_TOOL_INPUT_SIZE) {
        set.status = 400;
        return { error: "toolInput payload exceeds maximum allowed size" };
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

      // Find the most recent completed activity matching session + tool name + input.
      // Uses the pre-stringified toolInputJson for the JSONB comparison.
      const activity = await dbPool.query.agentActivities.findFirst({
        where: and(
          eq(agentActivities.sessionId, body.sessionId),
          eq(agentActivities.toolName, body.toolName),
          eq(agentActivities.status, "completed"),
          sql`${agentActivities.toolInput}::jsonb = ${toolInputJson}::jsonb`,
        ),
        orderBy: desc(agentActivities.createdAt),
      });

      if (!activity) {
        set.status = 404;
        return { error: "No matching activity found" };
      }

      // Permission check
      try {
        const { organizationId } = await validateProjectAccess(
          activity.projectId,
          auth.organizations,
        );

        const isSameUser = auth.user.id === activity.userId;
        const orgClaim = auth.organizations.find(
          (org) => org.id === organizationId,
        );
        const isAdmin =
          orgClaim?.roles.includes("admin") ||
          orgClaim?.roles.includes("owner");

        if (!isSameUser && !isAdmin) {
          set.status = 403;
          return { error: "Permission denied" };
        }
      } catch (err) {
        set.status = 403;
        return {
          error: err instanceof Error ? err.message : "Access denied",
        };
      }

      if (!activity.snapshotBefore) {
        set.status = 400;
        return { error: "This activity cannot be rolled back." };
      }

      try {
        const snapshot = activity.snapshotBefore as Snapshot;

        const description = await dbPool.transaction(async (tx) => {
          // Atomically claim the activity to prevent double-rollback
          const claimed = await tx
            .update(agentActivities)
            .set({ status: "rolled_back" })
            .where(
              and(
                eq(agentActivities.id, activity.id),
                eq(agentActivities.status, "completed"),
              ),
            )
            .returning({ id: agentActivities.id });

          if (claimed.length === 0) {
            throw new Error(
              "Activity has already been rolled back or its status changed",
            );
          }

          const desc = await applyRollback(snapshot, tx, activity.projectId);

          await tx.insert(agentActivities).values({
            organizationId: activity.organizationId,
            projectId: activity.projectId,
            sessionId: activity.sessionId,
            userId: auth.user.id,
            toolName: "rollback",
            toolInput: {
              matchedActivityId: activity.id,
              originalToolName: body.toolName,
            },
            toolOutput: { description: desc },
            status: "completed",
            affectedTaskIds: activity.affectedTaskIds,
          });

          return desc;
        });

        return {
          success: true,
          rolledBackActivityId: activity.id,
          description,
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Rollback failed";
        if (message.includes("already been rolled back")) {
          set.status = 409;
        } else {
          set.status = 500;
        }
        return { error: message };
      }
    },
    {
      body: t.Object({
        sessionId: t.String({ pattern: UUID_PATTERN }),
        toolName: t.String({ minLength: 1, maxLength: 100 }),
        toolInput: t.Unknown(),
      }),
    },
  );

export default aiRollbackRoutes;
