/**
 * queryProject tool definition.
 *
 * Get details about the current project including columns, labels, and task counts.
 */

import { count, eq } from "drizzle-orm";

import { dbPool } from "lib/db/db";
import { columns, labels, projects, tasks } from "lib/db/schema";

import type { ToolContext } from "../../core/context";
import type { QueryProjectInput } from "../../core/schemas";

export const QUERY_PROJECT_DESCRIPTION =
  "Get details about the current project, including all columns (statuses), labels, and task counts per column.";

export interface QueryProjectResult {
  project: {
    id: string;
    name: string;
    prefix: string | null;
    description: string | null;
    columns: Array<{
      id: string;
      title: string;
      icon: string | null;
      index: number;
      taskCount: number;
    }>;
    labels: Array<{
      id: string;
      name: string;
      color: string;
      icon: string | null;
    }>;
    totalTasks: number;
  };
}

export async function executeQueryProject(
  input: QueryProjectInput,
  ctx: ToolContext,
): Promise<QueryProjectResult> {
  const project = await dbPool.query.projects.findFirst({
    where: eq(projects.id, ctx.projectId),
    columns: {
      id: true,
      name: true,
      prefix: true,
      description: true,
    },
  });

  if (!project) {
    throw new Error(`Project ${ctx.projectId} not found`);
  }

  const projectColumns = await dbPool
    .select({
      id: columns.id,
      title: columns.title,
      icon: columns.icon,
      index: columns.index,
    })
    .from(columns)
    .where(eq(columns.projectId, ctx.projectId))
    .orderBy(columns.index);

  const projectLabels = await dbPool
    .select({
      id: labels.id,
      name: labels.name,
      color: labels.color,
      icon: labels.icon,
    })
    .from(labels)
    .where(eq(labels.projectId, ctx.projectId));

  const orgLabels = await dbPool
    .select({
      id: labels.id,
      name: labels.name,
      color: labels.color,
      icon: labels.icon,
    })
    .from(labels)
    .where(eq(labels.organizationId, ctx.organizationId));

  let columnsWithCounts = projectColumns.map((c) => ({
    ...c,
    taskCount: 0,
  }));
  let totalTasks = 0;

  if (input.includeTaskCounts !== false) {
    const taskCounts = await dbPool
      .select({ columnId: tasks.columnId, count: count() })
      .from(tasks)
      .where(eq(tasks.projectId, ctx.projectId))
      .groupBy(tasks.columnId);

    const countMap = new Map(taskCounts.map((tc) => [tc.columnId, tc.count]));
    columnsWithCounts = projectColumns.map((c) => ({
      ...c,
      taskCount: countMap.get(c.id) ?? 0,
    }));
    totalTasks = taskCounts.reduce((sum, tc) => sum + tc.count, 0);
  }

  return {
    project: {
      id: project.id,
      name: project.name,
      prefix: project.prefix,
      description: project.description,
      columns: columnsWithCounts,
      labels: [...projectLabels, ...orgLabels],
      totalTasks,
    },
  };
}
