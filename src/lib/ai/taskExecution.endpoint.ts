/**
 * Task execution REST endpoints.
 *
 * POST /api/ai/execute          — Assign task to agent (admin/owner)
 * GET  /api/ai/execute/:taskId  — Get execution history for a task
 * POST /api/ai/execute/:executionId/cancel — Cancel a running execution
 */

import { and, desc, eq } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { dbPool } from "lib/db/db";
import {
  githubInstallations,
  githubRepositories,
  taskExecutions,
} from "lib/db/schema";
import { checkOrgAdmin, checkOrgMember, checkProjectAccess } from "./auth";
import {
  ALLOWED_EXECUTION_MODELS,
  DEFAULT_EXECUTION_MODEL,
  MAX_CONCURRENT_EXECUTIONS,
  isAllowedExecutionModel,
} from "./constants";
import { agentFeatureGuard, authGuard } from "./guards";
import { runTaskExecution } from "./taskExecution";

import type { TaskExecutionStatus } from "lib/db/schema/taskExecution.table";

const taskExecutionRoutes = new Elysia({ prefix: "/api/ai/execute" })
  .use(agentFeatureGuard)
  .use(authGuard)
  /**
   * Assign a task to the agent for autonomous execution.
   * Admin/Owner only. Triggers background execution.
   */
  .post(
    "/",
    async ({ body, auth, set }) => {
      // Admin check
      const projectAccess = await checkProjectAccess(
        body.projectId,
        auth.organizations,
      );
      if (!projectAccess.ok) {
        set.status = projectAccess.status;
        return projectAccess.response;
      }

      const adminCheck = checkOrgAdmin(
        auth.organizations,
        projectAccess.value.organizationId,
        "assign tasks to agent",
      );
      if (!adminCheck.ok) {
        set.status = adminCheck.status;
        return adminCheck.response;
      }

      const organizationId = projectAccess.value.organizationId;

      // Validate model
      const model = body.model ?? DEFAULT_EXECUTION_MODEL;
      if (!isAllowedExecutionModel(model)) {
        set.status = 400;
        return {
          error: `Invalid model for execution. Allowed: ${ALLOWED_EXECUTION_MODELS.join(", ")}`,
        };
      }

      // Check GitHub installation
      const installation = await dbPool.query.githubInstallations.findFirst({
        where: eq(githubInstallations.organizationId, organizationId),
      });

      if (!installation || !installation.enabled) {
        set.status = 422;
        return {
          error:
            "GitHub App not installed. Install the Runa GitHub App to enable code execution.",
        };
      }

      // Check connected repository
      const repo = await dbPool.query.githubRepositories.findFirst({
        where: eq(githubRepositories.projectId, body.projectId),
      });

      if (!repo || !repo.enabled) {
        set.status = 422;
        return {
          error:
            "No repository connected to this project. Connect a repository in workspace settings.",
        };
      }

      // Check concurrent execution limit
      const runningCount = await dbPool
        .select({ id: taskExecutions.id })
        .from(taskExecutions)
        .where(
          and(
            eq(taskExecutions.organizationId, organizationId),
            eq(taskExecutions.status, "running" as TaskExecutionStatus),
          ),
        );

      if (runningCount.length >= MAX_CONCURRENT_EXECUTIONS) {
        set.status = 429;
        return {
          error: `Maximum ${MAX_CONCURRENT_EXECUTIONS} concurrent executions per organization. Wait for a running execution to finish.`,
        };
      }

      // Create execution record
      const [execution] = await dbPool
        .insert(taskExecutions)
        .values({
          organizationId,
          projectId: body.projectId,
          taskId: body.taskId,
          triggeredBy: auth.user.id,
          status: "queued",
          metadata: { model },
        })
        .returning();

      // Fire background execution (non-blocking)
      runTaskExecution({
        executionId: execution.id,
        taskId: body.taskId,
        projectId: body.projectId,
        organizationId,
        userId: auth.user.id,
        accessToken: auth.accessToken,
        model,
      }).catch((err) => {
        console.error("[TaskExecution] Background execution failed:", err);
      });

      set.status = 201;
      return {
        executionId: execution.id,
        status: execution.status,
      };
    },
    {
      body: t.Object({
        projectId: t.String(),
        taskId: t.String(),
        model: t.Optional(t.String()),
      }),
    },
  )
  /**
   * Get execution history for a task.
   * Returns the last 5 executions ordered by creation date.
   */
  .get(
    "/:taskId",
    async ({ params, query, auth, set }) => {
      const projectAccess = await checkProjectAccess(
        query.projectId,
        auth.organizations,
      );
      if (!projectAccess.ok) {
        set.status = projectAccess.status;
        return projectAccess.response;
      }

      const memberCheck = checkOrgMember(
        auth.organizations,
        projectAccess.value.organizationId,
      );
      if (!memberCheck.ok) {
        set.status = memberCheck.status;
        return memberCheck.response;
      }

      const executions = await dbPool
        .select()
        .from(taskExecutions)
        .where(
          and(
            eq(taskExecutions.taskId, params.taskId),
            eq(taskExecutions.projectId, query.projectId),
          ),
        )
        .orderBy(desc(taskExecutions.createdAt))
        .limit(5);

      return { executions };
    },
    {
      params: t.Object({
        taskId: t.String(),
      }),
      query: t.Object({
        projectId: t.String(),
      }),
    },
  )
  /**
   * Cancel a running execution.
   * Sets status to cancelled (container cleanup happens on next check).
   */
  .post(
    "/:executionId/cancel",
    async ({ params, auth, set }) => {
      const execution = await dbPool.query.taskExecutions.findFirst({
        where: eq(taskExecutions.id, params.executionId),
      });

      if (!execution) {
        set.status = 404;
        return { error: "Execution not found" };
      }

      const adminCheck = checkOrgAdmin(
        auth.organizations,
        execution.organizationId,
        "cancel task executions",
      );
      if (!adminCheck.ok) {
        set.status = adminCheck.status;
        return adminCheck.response;
      }

      if (execution.status !== "queued" && execution.status !== "running") {
        set.status = 400;
        return {
          error: `Cannot cancel execution with status: ${execution.status}`,
        };
      }

      await dbPool
        .update(taskExecutions)
        .set({
          status: "cancelled" as TaskExecutionStatus,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(taskExecutions.id, params.executionId));

      return { success: true };
    },
    {
      params: t.Object({
        executionId: t.String(),
      }),
    },
  );

export default taskExecutionRoutes;
