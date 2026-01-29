/**
 * assignTask tool definition.
 *
 * Add or remove an assignee on a task.
 */

import { and, count, eq } from "drizzle-orm";

import { dbPool } from "lib/db/db";
import { assignees, userOrganizations, users } from "lib/db/schema";
import { isWithinLimit } from "lib/entitlements/helpers";
import { resolveTask } from "../../core/helpers";

import type { WriteToolContext } from "../../core/context";
import type { AssignTaskInput } from "../../core/schemas";

export const ASSIGN_TASK_DESCRIPTION = "Add or remove an assignee on a task.";

export interface AssignTaskResult {
  taskId: string;
  taskNumber: number | null;
  taskTitle: string;
  userId: string;
  userName: string;
  action: "add" | "remove";
}

export async function executeAssignTask(
  input: AssignTaskInput,
  ctx: WriteToolContext,
): Promise<AssignTaskResult> {
  const task = await resolveTask(input, ctx.projectId);

  const membership = await dbPool.query.userOrganizations.findFirst({
    where: and(
      eq(userOrganizations.userId, input.userId),
      eq(userOrganizations.organizationId, ctx.organizationId),
    ),
  });

  if (!membership) {
    throw new Error(
      `User ${input.userId} is not a member of this organization.`,
    );
  }

  const user = await dbPool.query.users.findFirst({
    where: eq(users.id, input.userId),
    columns: { name: true },
  });

  if (!user) {
    throw new Error(`User ${input.userId} not found.`);
  }

  if (input.action === "add") {
    const assigneeCount = await dbPool
      .select({ count: count() })
      .from(assignees)
      .where(eq(assignees.taskId, task.id))
      .then((rows) => rows[0]?.count ?? 0);

    const withinLimit = await isWithinLimit(
      { organizationId: ctx.organizationId },
      "max_assignees",
      assigneeCount,
    );
    if (!withinLimit) {
      throw new Error("Assignee limit reached for your plan.");
    }

    await dbPool
      .insert(assignees)
      .values({ taskId: task.id, userId: input.userId })
      .onConflictDoNothing();
  } else {
    await dbPool
      .delete(assignees)
      .where(
        and(eq(assignees.taskId, task.id), eq(assignees.userId, input.userId)),
      );
  }

  return {
    taskId: task.id,
    taskNumber: task.number,
    taskTitle: task.content,
    userId: input.userId,
    userName: user.name,
    action: input.action,
  };
}
