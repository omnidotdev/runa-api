/**
 * Write tool implementations for the Runa AI Agent.
 *
 * All tools follow the same pattern:
 *  1. Check permission via requireProjectPermission()
 *  2. Resolve task (for tools that operate on existing tasks)
 *  3. Execute Drizzle ORM operation
 *  4. Log activity (fire-and-forget)
 *  5. Return typed output
 *
 * Errors are caught, logged with "failed"/"denied" status, and re-thrown
 * so the agent can report them to the user.
 */

import { and, count, eq } from "drizzle-orm";

import { dbPool } from "lib/db/db";
import {
  assignees,
  columns,
  posts,
  taskLabels,
  tasks,
  userOrganizations,
  users,
} from "lib/db/schema";
import { isWithinLimit } from "lib/entitlements/helpers";

import {
  addCommentDef,
  addLabelDef,
  assignTaskDef,
  createTaskDef,
  moveTaskDef,
  removeLabelDef,
  updateTaskDef,
  withApproval,
} from "../definitions";
import { logActivity } from "./activity";
import { getNextColumnIndex, resolveLabel, resolveTask } from "./helpers";
import { requireProjectPermission } from "./permissions";

import type { WriteToolContext } from "./context";

// ─────────────────────────────────────────────
// Factory
// ─────────────────────────────────────────────

interface WriteToolConfig {
  requireApprovalForCreate?: boolean;
}

/**
 * Create write tools scoped to a project with full auth context.
 *
 * Each tool checks permissions, executes the operation, and logs activity.
 * When `config.requireApprovalForCreate` is true, the createTask tool
 * will pause for user approval before executing.
 */
export function createWriteTools(
  context: WriteToolContext,
  config?: WriteToolConfig,
) {
  // ── createTask ──────────────────────────────
  const createTaskToolDef = config?.requireApprovalForCreate
    ? withApproval(createTaskDef, true)
    : createTaskDef;

  const createTask = createTaskToolDef.server(async (input) => {
    try {
      await requireProjectPermission(context, "editor");
    } catch (err) {
      logActivity({
        context,
        toolName: "createTask",
        toolInput: input,
        status: "denied",
        errorMessage: err instanceof Error ? err.message : "Permission denied",
      });
      throw err;
    }

    try {
      // Check entitlement limit
      const taskCount = await dbPool
        .select({ count: count() })
        .from(tasks)
        .where(eq(tasks.projectId, context.projectId))
        .then((rows) => rows[0]?.count ?? 0);

      const withinLimit = await isWithinLimit(
        { organizationId: context.organizationId },
        "max_tasks",
        taskCount,
      );

      if (!withinLimit) {
        throw new Error(
          "Task limit reached for your plan. Upgrade to create more tasks.",
        );
      }

      // Validate column belongs to this project
      const column = await dbPool.query.columns.findFirst({
        where: and(
          eq(columns.id, input.columnId),
          eq(columns.projectId, context.projectId),
        ),
        columns: { id: true, title: true },
      });

      if (!column) {
        throw new Error(
          `Column ${input.columnId} not found in this project.`,
        );
      }

      const nextIndex = await getNextColumnIndex(input.columnId);

      const [created] = await dbPool
        .insert(tasks)
        .values({
          content: input.title,
          description: input.description ?? "",
          priority: input.priority ?? "medium",
          columnId: input.columnId,
          columnIndex: nextIndex,
          projectId: context.projectId,
          authorId: context.userId,
          dueDate: input.dueDate ?? null,
        })
        .returning({
          id: tasks.id,
          number: tasks.number,
          title: tasks.content,
          columnId: tasks.columnId,
          priority: tasks.priority,
        });

      const result = {
        task: {
          id: created.id,
          number: created.number,
          title: created.title,
          columnId: created.columnId,
          columnTitle: column.title,
          priority: created.priority,
        },
      };

      logActivity({
        context,
        toolName: "createTask",
        toolInput: input,
        toolOutput: result,
        status: "completed",
        affectedTaskIds: [created.id],
        // No prior state — rollback means deleting the created task
        snapshotBefore: {
          operation: "create",
          entityType: "task",
          entityId: created.id,
        },
      });

      return result;
    } catch (err) {
      logActivity({
        context,
        toolName: "createTask",
        toolInput: input,
        status: "failed",
        errorMessage: err instanceof Error ? err.message : "Unknown error",
      });
      throw err;
    }
  });

  // ── updateTask ──────────────────────────────
  const updateTask = updateTaskDef.server(async (input) => {
    try {
      await requireProjectPermission(context, "editor");
    } catch (err) {
      logActivity({
        context,
        toolName: "updateTask",
        toolInput: input,
        status: "denied",
        errorMessage: err instanceof Error ? err.message : "Permission denied",
      });
      throw err;
    }

    try {
      const task = await resolveTask(input, context.projectId);

      // Snapshot the task state before the update for rollback support
      const snapshot = {
        operation: "update" as const,
        entityType: "task" as const,
        entityId: task.id,
        previousState: {
          content: task.content,
          description: task.description,
          priority: task.priority,
          dueDate: task.dueDate,
        },
      };

      // Build immutable patch from provided fields only
      const patch: Record<string, unknown> = {};
      if (input.title !== undefined) patch.content = input.title;
      if (input.description !== undefined) patch.description = input.description;
      if (input.priority !== undefined) patch.priority = input.priority;
      if (input.dueDate !== undefined) patch.dueDate = input.dueDate;

      if (Object.keys(patch).length === 0) {
        throw new Error("No fields to update. Provide at least one field.");
      }

      const [updated] = await dbPool
        .update(tasks)
        .set(patch)
        .where(eq(tasks.id, task.id))
        .returning({
          id: tasks.id,
          number: tasks.number,
          title: tasks.content,
          priority: tasks.priority,
          dueDate: tasks.dueDate,
        });

      const result = {
        task: {
          id: updated.id,
          number: updated.number,
          title: updated.title,
          priority: updated.priority,
          dueDate: updated.dueDate,
        },
      };

      logActivity({
        context,
        toolName: "updateTask",
        toolInput: input,
        toolOutput: result,
        status: "completed",
        affectedTaskIds: [task.id],
        snapshotBefore: snapshot,
      });

      return result;
    } catch (err) {
      logActivity({
        context,
        toolName: "updateTask",
        toolInput: input,
        status: "failed",
        errorMessage: err instanceof Error ? err.message : "Unknown error",
      });
      throw err;
    }
  });

  // ── moveTask ────────────────────────────────
  const moveTask = moveTaskDef.server(async (input) => {
    try {
      await requireProjectPermission(context, "editor");
    } catch (err) {
      logActivity({
        context,
        toolName: "moveTask",
        toolInput: input,
        status: "denied",
        errorMessage: err instanceof Error ? err.message : "Permission denied",
      });
      throw err;
    }

    try {
      const task = await resolveTask(input, context.projectId);

      // Snapshot column position before the move
      const snapshot = {
        operation: "move" as const,
        entityType: "task" as const,
        entityId: task.id,
        previousState: {
          columnId: task.columnId,
          columnIndex: task.columnIndex,
        },
      };

      // Validate target column belongs to this project
      const targetColumn = await dbPool.query.columns.findFirst({
        where: and(
          eq(columns.id, input.columnId),
          eq(columns.projectId, context.projectId),
        ),
        columns: { id: true, title: true },
      });

      if (!targetColumn) {
        throw new Error(
          `Column ${input.columnId} not found in this project.`,
        );
      }

      // Get source column title
      const sourceColumn = await dbPool.query.columns.findFirst({
        where: eq(columns.id, task.columnId),
        columns: { title: true },
      });

      const nextIndex = await getNextColumnIndex(input.columnId);

      await dbPool
        .update(tasks)
        .set({
          columnId: input.columnId,
          columnIndex: nextIndex,
        })
        .where(eq(tasks.id, task.id));

      const result = {
        task: {
          id: task.id,
          number: task.number,
          title: task.content,
        },
        fromColumn: sourceColumn?.title ?? "Unknown",
        toColumn: targetColumn.title,
      };

      logActivity({
        context,
        toolName: "moveTask",
        toolInput: input,
        toolOutput: result,
        status: "completed",
        affectedTaskIds: [task.id],
        snapshotBefore: snapshot,
      });

      return result;
    } catch (err) {
      logActivity({
        context,
        toolName: "moveTask",
        toolInput: input,
        status: "failed",
        errorMessage: err instanceof Error ? err.message : "Unknown error",
      });
      throw err;
    }
  });

  // ── assignTask ──────────────────────────────
  const assignTask = assignTaskDef.server(async (input) => {
    try {
      await requireProjectPermission(context, "member");
    } catch (err) {
      logActivity({
        context,
        toolName: "assignTask",
        toolInput: input,
        status: "denied",
        errorMessage: err instanceof Error ? err.message : "Permission denied",
      });
      throw err;
    }

    try {
      const task = await resolveTask(input, context.projectId);

      // Validate user is a member of this organization
      const membership =
        await dbPool.query.userOrganizations.findFirst({
          where: and(
            eq(userOrganizations.userId, input.userId),
            eq(
              userOrganizations.organizationId,
              context.organizationId,
            ),
          ),
        });

      if (!membership) {
        throw new Error(
          `User ${input.userId} is not a member of this organization.`,
        );
      }

      // Look up user name for the response
      const user = await dbPool.query.users.findFirst({
        where: eq(users.id, input.userId),
        columns: { name: true },
      });

      if (!user) {
        throw new Error(`User ${input.userId} not found.`);
      }

      if (input.action === "add") {
        // Check entitlement limit for assignees
        const assigneeCount = await dbPool
          .select({ count: count() })
          .from(assignees)
          .where(eq(assignees.taskId, task.id))
          .then((rows) => rows[0]?.count ?? 0);

        const withinLimit = await isWithinLimit(
          { organizationId: context.organizationId },
          "max_assignees",
          assigneeCount,
        );

        if (!withinLimit) {
          throw new Error(
            "Assignee limit reached for your plan. Upgrade to add more assignees.",
          );
        }

        // Idempotent insert
        await dbPool
          .insert(assignees)
          .values({
            taskId: task.id,
            userId: input.userId,
          })
          .onConflictDoNothing();
      } else {
        await dbPool
          .delete(assignees)
          .where(
            and(
              eq(assignees.taskId, task.id),
              eq(assignees.userId, input.userId),
            ),
          );
      }

      const result = {
        taskId: task.id,
        taskNumber: task.number,
        taskTitle: task.content,
        userId: input.userId,
        userName: user.name,
        action: input.action,
      };

      logActivity({
        context,
        toolName: "assignTask",
        toolInput: input,
        toolOutput: result,
        status: "completed",
        affectedTaskIds: [task.id],
        // Rollback reverses the action: add → remove, remove → add
        snapshotBefore: {
          operation: input.action === "add" ? "assign" : "unassign",
          entityType: "assignee",
          entityId: task.id,
          previousState: { taskId: task.id, userId: input.userId },
        },
      });

      return result;
    } catch (err) {
      logActivity({
        context,
        toolName: "assignTask",
        toolInput: input,
        status: "failed",
        errorMessage: err instanceof Error ? err.message : "Unknown error",
      });
      throw err;
    }
  });

  // ── addLabel ────────────────────────────────
  const addLabel = addLabelDef.server(async (input) => {
    try {
      await requireProjectPermission(context, "member");
    } catch (err) {
      logActivity({
        context,
        toolName: "addLabel",
        toolInput: input,
        status: "denied",
        errorMessage: err instanceof Error ? err.message : "Permission denied",
      });
      throw err;
    }

    try {
      const task = await resolveTask(input, context.projectId);
      const label = await resolveLabel(
        input.labelId,
        context.projectId,
        context.organizationId,
      );

      // Idempotent insert
      await dbPool
        .insert(taskLabels)
        .values({
          taskId: task.id,
          labelId: input.labelId,
        })
        .onConflictDoNothing();

      const result = {
        taskId: task.id,
        taskNumber: task.number,
        taskTitle: task.content,
        labelId: label.id,
        labelName: label.name,
      };

      logActivity({
        context,
        toolName: "addLabel",
        toolInput: input,
        toolOutput: result,
        status: "completed",
        affectedTaskIds: [task.id],
        // Rollback means removing this label from the task
        snapshotBefore: {
          operation: "addLabel",
          entityType: "taskLabel",
          entityId: task.id,
          previousState: { taskId: task.id, labelId: label.id },
        },
      });

      return result;
    } catch (err) {
      logActivity({
        context,
        toolName: "addLabel",
        toolInput: input,
        status: "failed",
        errorMessage: err instanceof Error ? err.message : "Unknown error",
      });
      throw err;
    }
  });

  // ── removeLabel ─────────────────────────────
  const removeLabel = removeLabelDef.server(async (input) => {
    try {
      await requireProjectPermission(context, "member");
    } catch (err) {
      logActivity({
        context,
        toolName: "removeLabel",
        toolInput: input,
        status: "denied",
        errorMessage: err instanceof Error ? err.message : "Permission denied",
      });
      throw err;
    }

    try {
      const task = await resolveTask(input, context.projectId);
      const label = await resolveLabel(
        input.labelId,
        context.projectId,
        context.organizationId,
      );

      await dbPool
        .delete(taskLabels)
        .where(
          and(
            eq(taskLabels.taskId, task.id),
            eq(taskLabels.labelId, input.labelId),
          ),
        );

      const result = {
        taskId: task.id,
        taskNumber: task.number,
        taskTitle: task.content,
        labelId: label.id,
        labelName: label.name,
      };

      logActivity({
        context,
        toolName: "removeLabel",
        toolInput: input,
        toolOutput: result,
        status: "completed",
        affectedTaskIds: [task.id],
        // Rollback means re-adding this label to the task
        snapshotBefore: {
          operation: "removeLabel",
          entityType: "taskLabel",
          entityId: task.id,
          previousState: { taskId: task.id, labelId: label.id },
        },
      });

      return result;
    } catch (err) {
      logActivity({
        context,
        toolName: "removeLabel",
        toolInput: input,
        status: "failed",
        errorMessage: err instanceof Error ? err.message : "Unknown error",
      });
      throw err;
    }
  });

  // ── addComment ──────────────────────────────
  const addComment = addCommentDef.server(async (input) => {
    try {
      await requireProjectPermission(context, "member");
    } catch (err) {
      logActivity({
        context,
        toolName: "addComment",
        toolInput: input,
        status: "denied",
        errorMessage: err instanceof Error ? err.message : "Permission denied",
      });
      throw err;
    }

    try {
      const task = await resolveTask(input, context.projectId);

      const [comment] = await dbPool
        .insert(posts)
        .values({
          description: input.content,
          authorId: context.userId,
          taskId: task.id,
        })
        .returning({ id: posts.id });

      const result = {
        commentId: comment.id,
        taskId: task.id,
        taskNumber: task.number,
        taskTitle: task.content,
      };

      logActivity({
        context,
        toolName: "addComment",
        toolInput: input,
        toolOutput: result,
        status: "completed",
        affectedTaskIds: [task.id],
        // Rollback means deleting the created comment
        snapshotBefore: {
          operation: "addComment",
          entityType: "comment",
          entityId: comment.id,
        },
      });

      return result;
    } catch (err) {
      logActivity({
        context,
        toolName: "addComment",
        toolInput: input,
        status: "failed",
        errorMessage: err instanceof Error ? err.message : "Unknown error",
      });
      throw err;
    }
  });

  return {
    createTask,
    updateTask,
    moveTask,
    assignTask,
    addLabel,
    removeLabel,
    addComment,
  };
}
