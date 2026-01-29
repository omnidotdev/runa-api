/**
 * getTask tool definition.
 *
 * Get full details of a single task by ID or task number.
 */

import { and, count, eq } from "drizzle-orm";

import { dbPool } from "lib/db/db";
import {
  assignees,
  columns,
  labels,
  posts,
  taskLabels,
  tasks,
  users,
} from "lib/db/schema";

import type { ToolContext } from "../../core/context";
import type { GetTaskInput } from "../../core/schemas";

export const GET_TASK_DESCRIPTION =
  "Get full details of a single task by its ID or task number.";

export interface GetTaskResult {
  task: {
    id: string;
    number: number | null;
    title: string;
    description: string | null;
    priority: string;
    columnId: string;
    columnTitle: string;
    dueDate: string | null;
    assignees: Array<{ id: string; name: string; email: string }>;
    labels: Array<{ id: string; name: string; color: string }>;
    commentCount: number;
    createdAt: string;
    updatedAt: string;
  } | null;
}

export async function executeGetTask(
  input: GetTaskInput,
  ctx: ToolContext,
): Promise<GetTaskResult> {
  if (!input.taskId && input.taskNumber === undefined) {
    return { task: null };
  }

  let taskRow: typeof tasks.$inferSelect | undefined;

  if (input.taskId) {
    taskRow = await dbPool.query.tasks.findFirst({
      where: and(
        eq(tasks.id, input.taskId),
        eq(tasks.projectId, ctx.projectId),
      ),
    });
  } else if (input.taskNumber !== undefined) {
    taskRow = await dbPool.query.tasks.findFirst({
      where: and(
        eq(tasks.number, input.taskNumber),
        eq(tasks.projectId, ctx.projectId),
      ),
    });
  }

  if (!taskRow) {
    return { task: null };
  }

  const [taskAssignees, taskLabelRows, column, commentCount] =
    await Promise.all([
      dbPool
        .select({
          userId: users.id,
          userName: users.name,
          userEmail: users.email,
        })
        .from(assignees)
        .innerJoin(users, eq(assignees.userId, users.id))
        .where(eq(assignees.taskId, taskRow.id)),
      dbPool
        .select({
          labelId: labels.id,
          labelName: labels.name,
          labelColor: labels.color,
        })
        .from(taskLabels)
        .innerJoin(labels, eq(taskLabels.labelId, labels.id))
        .where(eq(taskLabels.taskId, taskRow.id)),
      dbPool.query.columns.findFirst({
        where: eq(columns.id, taskRow.columnId),
        columns: { title: true },
      }),
      dbPool
        .select({ count: count() })
        .from(posts)
        .where(eq(posts.taskId, taskRow.id))
        .then((rows) => rows[0]?.count ?? 0),
    ]);

  return {
    task: {
      id: taskRow.id,
      number: taskRow.number,
      title: taskRow.content,
      description: taskRow.description,
      priority: taskRow.priority,
      columnId: taskRow.columnId,
      columnTitle: column?.title ?? "Unknown",
      dueDate: taskRow.dueDate,
      assignees: taskAssignees.map((a) => ({
        id: a.userId,
        name: a.userName,
        email: a.userEmail,
      })),
      labels: taskLabelRows.map((l) => ({
        id: l.labelId,
        name: l.labelName,
        color: l.labelColor,
      })),
      commentCount,
      createdAt: String(taskRow.createdAt),
      updatedAt: String(taskRow.updatedAt),
    },
  };
}
