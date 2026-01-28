import { and, count, eq, ilike, inArray } from "drizzle-orm";

import { dbPool } from "lib/db/db";
import {
  assignees,
  columns,
  labels,
  posts,
  projects,
  taskLabels,
  tasks,
  users,
} from "lib/db/schema";
import { getTaskDef, queryProjectDef, queryTasksDef } from "../definitions";

/**
 * Create read-only server tools scoped to a project.
 *
 * All tools operate within the given project context
 * and do not require additional authorization checks
 * (the user's project access is validated at the endpoint level).
 */
export function createQueryTools(context: {
  projectId: string;
  organizationId: string;
}) {
  const queryTasks = queryTasksDef.server(async (input) => {
    const conditions = [eq(tasks.projectId, context.projectId)];

    if (input.search) {
      conditions.push(ilike(tasks.content, `%${input.search}%`));
    }
    if (input.columnId) {
      conditions.push(eq(tasks.columnId, input.columnId));
    }
    if (input.priority) {
      conditions.push(eq(tasks.priority, input.priority));
    }

    // Base task query
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

    // Filter by assignee if specified
    if (input.assigneeId) {
      const assignedTaskIds = await dbPool
        .select({ taskId: assignees.taskId })
        .from(assignees)
        .where(eq(assignees.userId, input.assigneeId));

      const assignedIdSet = new Set(assignedTaskIds.map((a) => a.taskId));
      taskRows = taskRows.filter((t) => assignedIdSet.has(t.id));
    }

    // Filter by label if specified
    if (input.labelId) {
      const labeledTaskIds = await dbPool
        .select({ taskId: taskLabels.taskId })
        .from(taskLabels)
        .where(eq(taskLabels.labelId, input.labelId));

      const labeledIdSet = new Set(labeledTaskIds.map((l) => l.taskId));
      taskRows = taskRows.filter((t) => labeledIdSet.has(t.id));
    }

    // Batch-load related data for all matching tasks
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
        .where(eq(columns.projectId, context.projectId)),
    ]);

    // Build lookup maps
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
        createdAt: t.createdAt,
      })),
      totalCount: taskRows.length,
    };
  });

  const queryProject = queryProjectDef.server(async (input) => {
    const project = await dbPool.query.projects.findFirst({
      where: eq(projects.id, context.projectId),
      columns: {
        id: true,
        name: true,
        prefix: true,
        description: true,
      },
    });

    if (!project) {
      throw new Error(`Project ${context.projectId} not found`);
    }

    const projectColumns = await dbPool
      .select({
        id: columns.id,
        title: columns.title,
        icon: columns.icon,
        index: columns.index,
      })
      .from(columns)
      .where(eq(columns.projectId, context.projectId))
      .orderBy(columns.index);

    const projectLabels = await dbPool
      .select({
        id: labels.id,
        name: labels.name,
        color: labels.color,
        icon: labels.icon,
      })
      .from(labels)
      .where(eq(labels.projectId, context.projectId));

    // Org-scoped labels
    const orgLabels = await dbPool
      .select({
        id: labels.id,
        name: labels.name,
        color: labels.color,
        icon: labels.icon,
      })
      .from(labels)
      .where(eq(labels.organizationId, context.organizationId));

    // Task counts per column
    let columnsWithCounts = projectColumns.map((c) => ({
      ...c,
      taskCount: 0,
    }));
    let totalTasks = 0;

    if (input.includeTaskCounts !== false) {
      const taskCounts = await dbPool
        .select({
          columnId: tasks.columnId,
          count: count(),
        })
        .from(tasks)
        .where(eq(tasks.projectId, context.projectId))
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
  });

  const getTask = getTaskDef.server(async (input) => {
    if (!input.taskId && input.taskNumber === undefined) {
      return { task: null };
    }

    let taskRow: typeof tasks.$inferSelect | undefined;

    if (input.taskId) {
      taskRow = await dbPool.query.tasks.findFirst({
        where: and(
          eq(tasks.id, input.taskId),
          eq(tasks.projectId, context.projectId),
        ),
      });
    } else if (input.taskNumber !== undefined) {
      taskRow = await dbPool.query.tasks.findFirst({
        where: and(
          eq(tasks.number, input.taskNumber),
          eq(tasks.projectId, context.projectId),
        ),
      });
    }

    if (!taskRow) {
      return { task: null };
    }

    // Fetch related data
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
        createdAt: taskRow.createdAt,
        updatedAt: taskRow.updatedAt,
      },
    };
  });

  return { queryTasks, queryProject, getTask };
}
