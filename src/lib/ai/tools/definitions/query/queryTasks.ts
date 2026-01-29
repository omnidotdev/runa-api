/**
 * queryTasks tool definition.
 *
 * Search and filter tasks in the current project.
 */

import { and, eq, ilike, inArray } from "drizzle-orm";

import { dbPool } from "lib/db/db";
import {
  assignees,
  columns,
  labels,
  taskLabels,
  tasks,
  users,
} from "lib/db/schema";

import type { ToolContext } from "../../core/context";
import type { QueryTasksInput } from "../../core/schemas";

export const QUERY_TASKS_DESCRIPTION =
  "Search and filter tasks in the current project. Use this to find tasks by keyword, assignee, label, priority, column/status, or to list all tasks.";

export interface QueryTasksResult {
  tasks: Array<{
    id: string;
    number: number | null;
    title: string;
    description: string | null;
    priority: string;
    columnId: string;
    columnTitle: string;
    dueDate: string | null;
    assignees: Array<{ id: string; name: string }>;
    labels: Array<{ id: string; name: string; color: string }>;
    createdAt: string;
  }>;
  totalCount: number;
}

export async function executeQueryTasks(
  input: QueryTasksInput,
  ctx: ToolContext,
): Promise<QueryTasksResult> {
  const conditions = [eq(tasks.projectId, ctx.projectId)];

  if (input.search) {
    conditions.push(ilike(tasks.content, `%${input.search}%`));
  }
  if (input.columnId) {
    conditions.push(eq(tasks.columnId, input.columnId));
  }
  if (input.priority) {
    conditions.push(eq(tasks.priority, input.priority));
  }

  let taskRows = await dbPool
    .select({
      id: tasks.id,
      number: tasks.number,
      title: tasks.content,
      description: tasks.description,
      priority: tasks.priority,
      columnId: tasks.columnId,
      dueDate: tasks.dueDate,
      createdAt: tasks.createdAt,
    })
    .from(tasks)
    .where(and(...conditions))
    .limit(input.limit ?? 50)
    .orderBy(tasks.createdAt);

  if (input.assigneeId) {
    const assignedTaskIds = await dbPool
      .select({ taskId: assignees.taskId })
      .from(assignees)
      .where(eq(assignees.userId, input.assigneeId));
    const assignedIdSet = new Set(assignedTaskIds.map((a) => a.taskId));
    taskRows = taskRows.filter((t) => assignedIdSet.has(t.id));
  }

  if (input.labelId) {
    const labeledTaskIds = await dbPool
      .select({ taskId: taskLabels.taskId })
      .from(taskLabels)
      .where(eq(taskLabels.labelId, input.labelId));
    const labeledIdSet = new Set(labeledTaskIds.map((l) => l.taskId));
    taskRows = taskRows.filter((t) => labeledIdSet.has(t.id));
  }

  const taskIds = taskRows.map((t) => t.id);

  const [taskAssignees, taskLabelRows, columnRows] = await Promise.all([
    taskIds.length > 0
      ? dbPool
          .select({
            taskId: assignees.taskId,
            userId: assignees.userId,
            userName: users.name,
          })
          .from(assignees)
          .innerJoin(users, eq(assignees.userId, users.id))
          .where(inArray(assignees.taskId, taskIds))
      : [],
    taskIds.length > 0
      ? dbPool
          .select({
            taskId: taskLabels.taskId,
            labelId: labels.id,
            labelName: labels.name,
            labelColor: labels.color,
          })
          .from(taskLabels)
          .innerJoin(labels, eq(taskLabels.labelId, labels.id))
          .where(inArray(taskLabels.taskId, taskIds))
      : [],
    dbPool
      .select({ id: columns.id, title: columns.title })
      .from(columns)
      .where(eq(columns.projectId, ctx.projectId)),
  ]);

  const columnMap = new Map(columnRows.map((c) => [c.id, c.title]));
  const assigneeMap = new Map<string, Array<{ id: string; name: string }>>();
  for (const a of taskAssignees) {
    const existing = assigneeMap.get(a.taskId) ?? [];
    existing.push({ id: a.userId, name: a.userName });
    assigneeMap.set(a.taskId, existing);
  }
  const labelMap = new Map<
    string,
    Array<{ id: string; name: string; color: string }>
  >();
  for (const l of taskLabelRows) {
    const existing = labelMap.get(l.taskId) ?? [];
    existing.push({
      id: l.labelId,
      name: l.labelName,
      color: l.labelColor,
    });
    labelMap.set(l.taskId, existing);
  }

  return {
    tasks: taskRows.map((t) => ({
      id: t.id,
      number: t.number,
      title: t.title,
      description: t.description,
      priority: t.priority,
      columnId: t.columnId,
      columnTitle: columnMap.get(t.columnId) ?? "Unknown",
      dueDate: t.dueDate,
      assignees: assigneeMap.get(t.id) ?? [],
      labels: labelMap.get(t.id) ?? [],
      createdAt: String(t.createdAt),
    })),
    totalCount: taskRows.length,
  };
}
