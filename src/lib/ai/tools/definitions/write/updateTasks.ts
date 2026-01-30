/**
 * updateTasks tool definition.
 *
 * Unified tool for all task update operations:
 * - Field updates (title, description, priority, dueDate)
 * - Move to column (columnId)
 * - Reorder within column (columnIndex)
 * - Assignee management (assignees.add/remove/set)
 * - Label management (labels.add/remove/set)
 *
 * Execution strategy:
 * - Field updates and relationship ops execute in parallel
 * - Column moves with columnIndex execute sequentially for ordering
 */

import { and, count, eq, inArray, or } from "drizzle-orm";

import { dbPool } from "lib/db/db";
import {
  assignees,
  columns,
  labels,
  taskLabels,
  tasks,
  userOrganizations,
} from "lib/db/schema";
import { isWithinLimit } from "lib/entitlements/helpers";
import { getNextColumnIndex, resolveTasks } from "../../core/helpers";

import type { WriteToolContext } from "../../core/context";
import type {
  LabelAdd,
  UpdateTaskItem,
  UpdateTasksInput,
} from "../../core/schemas";
import type { MarkdownToHtmlFn } from "./createTasks";

export const UPDATE_TASKS_DESCRIPTION =
  "Update one or more tasks. Supports field updates (title, description, priority, dueDate), " +
  "moving to columns, reordering, and managing assignees/labels.";

interface UpdateTasksResultItem {
  id: string;
  number: number | null;
  title: string;
  priority: string;
  dueDate: string | null;
  columnId: string;
  columnIndex: number;
  operations: string[];
}

interface UpdateTasksSnapshotItem {
  taskId: string;
  content: string;
  description: string | null;
  priority: string;
  dueDate: string | null;
  columnId: string;
  columnIndex: number;
  assigneeIds: string[];
  labelIds: string[];
}

interface UpdateTasksResult {
  updatedCount: number;
  tasks: UpdateTasksResultItem[];
  affectedIds: string[];
  snapshotBefore: UpdateTasksSnapshotItem[];
}

/** Task patch fields. */
interface TaskPatch {
  content?: string;
  description?: string;
  priority?: string;
  dueDate?: string | null;
  columnId?: string;
  columnIndex?: number;
}

/**
 * Build field patch from update item.
 */
function buildFieldPatch(
  update: UpdateTaskItem,
  markdownToHtml?: MarkdownToHtmlFn,
): TaskPatch {
  const patch: TaskPatch = {};

  if (update.title !== undefined) patch.content = update.title;
  if (update.description !== undefined) {
    patch.description = markdownToHtml
      ? markdownToHtml(update.description)
      : update.description;
  }
  if (update.priority !== undefined) patch.priority = update.priority;
  if (update.dueDate !== undefined) patch.dueDate = update.dueDate;

  return patch;
}

export async function executeUpdateTasks(
  input: UpdateTasksInput,
  ctx: WriteToolContext,
  markdownToHtml?: MarkdownToHtmlFn,
): Promise<UpdateTasksResult> {
  // Build task refs for batch resolution
  const refs = input.updates.map((u) => ({
    taskId: u.taskId,
    taskNumber: u.taskNumber,
  }));

  // Batch resolve all tasks in a single query
  const resolvedTasks = await resolveTasks(refs, ctx.projectId);

  // Collect unique user IDs from assignee operations
  const allUserIds = new Set<string>();
  for (const update of input.updates) {
    if (update.assignees?.add) {
      for (const uid of update.assignees.add) allUserIds.add(uid);
    }
    if (update.assignees?.remove) {
      for (const uid of update.assignees.remove) allUserIds.add(uid);
    }
    if (update.assignees?.set) {
      for (const uid of update.assignees.set) allUserIds.add(uid);
    }
  }

  // Collect label info for batch lookup
  const labelIdsToLookup = new Set<string>();
  const labelNamesToLookup = new Set<string>();
  for (const update of input.updates) {
    if (update.labels?.add) {
      for (const l of update.labels.add) {
        if (l.labelId) labelIdsToLookup.add(l.labelId);
        else if (l.labelName) labelNamesToLookup.add(l.labelName.trim());
      }
    }
    if (update.labels?.remove) {
      for (const lid of update.labels.remove) labelIdsToLookup.add(lid);
    }
    if (update.labels?.set) {
      for (const lid of update.labels.set) labelIdsToLookup.add(lid);
    }
  }

  // Collect column IDs for validation
  const columnIdsToValidate = new Set<string>();
  for (const update of input.updates) {
    if (update.columnId) columnIdsToValidate.add(update.columnId);
  }

  // Batch lookups in parallel
  const [
    memberships,
    existingLabelsById,
    existingLabelsByName,
    validColumns,
    currentAssignees,
    currentLabels,
  ] = await Promise.all([
    // User memberships
    allUserIds.size > 0
      ? dbPool.query.userOrganizations.findMany({
          where: and(
            inArray(userOrganizations.userId, [...allUserIds]),
            eq(userOrganizations.organizationId, ctx.organizationId),
          ),
        })
      : [],
    // Labels by ID
    labelIdsToLookup.size > 0
      ? dbPool.query.labels.findMany({
          where: and(
            inArray(labels.id, [...labelIdsToLookup]),
            or(
              eq(labels.projectId, ctx.projectId),
              eq(labels.organizationId, ctx.organizationId),
            ),
          ),
          columns: { id: true, name: true },
        })
      : [],
    // Labels by name
    labelNamesToLookup.size > 0
      ? dbPool.query.labels.findMany({
          where: and(
            inArray(labels.name, [...labelNamesToLookup]),
            or(
              eq(labels.projectId, ctx.projectId),
              eq(labels.organizationId, ctx.organizationId),
            ),
          ),
          columns: { id: true, name: true },
        })
      : [],
    // Validate columns belong to project
    columnIdsToValidate.size > 0
      ? dbPool.query.columns.findMany({
          where: and(
            inArray(columns.id, [...columnIdsToValidate]),
            eq(columns.projectId, ctx.projectId),
          ),
          columns: { id: true, title: true },
        })
      : [],
    // Current assignees for all tasks
    dbPool.query.assignees.findMany({
      where: inArray(
        assignees.taskId,
        resolvedTasks.map((t) => t.id),
      ),
      columns: { taskId: true, userId: true },
    }),
    // Current labels for all tasks
    dbPool.query.taskLabels.findMany({
      where: inArray(
        taskLabels.taskId,
        resolvedTasks.map((t) => t.id),
      ),
      columns: { taskId: true, labelId: true },
    }),
  ]);

  // Create lookup maps
  const membershipSet = new Set(memberships.map((m) => m.userId));
  const labelByIdMap = new Map(existingLabelsById.map((l) => [l.id, l]));
  const labelByNameMap = new Map(
    existingLabelsByName.map((l) => [l.name.toLowerCase(), l]),
  );
  const validColumnSet = new Set(validColumns.map((c) => c.id));

  // Validate all users are organization members
  for (const userId of allUserIds) {
    if (!membershipSet.has(userId)) {
      throw new Error(`User ${userId} is not a member of this organization.`);
    }
  }

  // Validate all target columns exist
  for (const colId of columnIdsToValidate) {
    if (!validColumnSet.has(colId)) {
      throw new Error(`Column ${colId} not found in this project.`);
    }
  }

  // Build assignee map per task
  const taskAssigneesMap = new Map<string, Set<string>>();
  for (const a of currentAssignees) {
    if (!taskAssigneesMap.has(a.taskId)) {
      taskAssigneesMap.set(a.taskId, new Set());
    }
    taskAssigneesMap.get(a.taskId)!.add(a.userId);
  }

  // Build label map per task
  const taskLabelsMap = new Map<string, Set<string>>();
  for (const tl of currentLabels) {
    if (!taskLabelsMap.has(tl.taskId)) {
      taskLabelsMap.set(tl.taskId, new Set());
    }
    taskLabelsMap.get(tl.taskId)!.add(tl.labelId);
  }

  // Snapshot before updates
  const snapshotBefore: UpdateTasksSnapshotItem[] = resolvedTasks.map((t) => ({
    taskId: t.id,
    content: t.content,
    description: t.description,
    priority: t.priority,
    dueDate: t.dueDate,
    columnId: t.columnId,
    columnIndex: t.columnIndex,
    assigneeIds: [...(taskAssigneesMap.get(t.id) ?? [])],
    labelIds: [...(taskLabelsMap.get(t.id) ?? [])],
  }));

  // Track column index counters for sequential moves
  const columnIndexCounters = new Map<string, number>();

  // Execute updates in transaction
  const results = await dbPool.transaction(async (tx) => {
    const updateResults: UpdateTasksResultItem[] = [];

    for (let i = 0; i < input.updates.length; i++) {
      const update = input.updates[i];
      const task = resolvedTasks[i];
      const operations: string[] = [];

      // 1. Field updates
      const fieldPatch = buildFieldPatch(update, markdownToHtml);
      if (Object.keys(fieldPatch).length > 0) {
        operations.push("fields");
      }

      // 2. Column move
      let newColumnId = task.columnId;
      let newColumnIndex = task.columnIndex;

      if (update.columnId && update.columnId !== task.columnId) {
        newColumnId = update.columnId;
        operations.push("move");

        // Get next index for target column (sequential for ordering)
        if (!columnIndexCounters.has(update.columnId)) {
          columnIndexCounters.set(
            update.columnId,
            await getNextColumnIndex(update.columnId),
          );
        }
        newColumnIndex = columnIndexCounters.get(update.columnId)!;
        columnIndexCounters.set(update.columnId, newColumnIndex + 1);
      }

      // 3. Explicit column index (reorder)
      if (update.columnIndex !== undefined) {
        newColumnIndex = update.columnIndex;
        if (!operations.includes("move")) {
          operations.push("reorder");
        }
      }

      // Apply field + column updates
      const combinedPatch: TaskPatch = {
        ...fieldPatch,
        ...(newColumnId !== task.columnId ? { columnId: newColumnId } : {}),
        ...(newColumnIndex !== task.columnIndex
          ? { columnIndex: newColumnIndex }
          : {}),
      };

      if (Object.keys(combinedPatch).length > 0) {
        await tx.update(tasks).set(combinedPatch).where(eq(tasks.id, task.id));
      }

      // 4. Assignee operations
      if (update.assignees) {
        const currentSet = taskAssigneesMap.get(task.id) ?? new Set();

        if (update.assignees.set !== undefined) {
          // Replace all assignees
          const targetSet = new Set(update.assignees.set);

          // Remove those not in target
          const toRemove = [...currentSet].filter((uid) => !targetSet.has(uid));
          if (toRemove.length > 0) {
            await tx
              .delete(assignees)
              .where(
                and(
                  eq(assignees.taskId, task.id),
                  inArray(assignees.userId, toRemove),
                ),
              );
          }

          // Add those not in current
          const toAdd = [...targetSet].filter((uid) => !currentSet.has(uid));
          for (const userId of toAdd) {
            // Check limit
            const assigneeCount = await tx
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
              throw new Error(
                `Assignee limit reached for task ${task.number ?? task.id}.`,
              );
            }

            await tx
              .insert(assignees)
              .values({ taskId: task.id, userId })
              .onConflictDoNothing();
          }

          if (toRemove.length > 0 || toAdd.length > 0) {
            operations.push("assignees");
          }
        } else {
          // Add/remove operations
          if (update.assignees.remove && update.assignees.remove.length > 0) {
            await tx
              .delete(assignees)
              .where(
                and(
                  eq(assignees.taskId, task.id),
                  inArray(assignees.userId, update.assignees.remove),
                ),
              );
            operations.push("assignees");
          }

          if (update.assignees.add && update.assignees.add.length > 0) {
            for (const userId of update.assignees.add) {
              if (currentSet.has(userId)) continue; // Already assigned

              const assigneeCount = await tx
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
                throw new Error(
                  `Assignee limit reached for task ${task.number ?? task.id}.`,
                );
              }

              await tx
                .insert(assignees)
                .values({ taskId: task.id, userId })
                .onConflictDoNothing();
            }
            if (!operations.includes("assignees")) {
              operations.push("assignees");
            }
          }
        }
      }

      // 5. Label operations
      if (update.labels) {
        const currentLabelSet = taskLabelsMap.get(task.id) ?? new Set();

        if (update.labels.set !== undefined) {
          // Replace all labels
          const targetSet = new Set(update.labels.set);

          // Validate all target labels exist
          for (const lid of targetSet) {
            if (!labelByIdMap.has(lid)) {
              throw new Error(
                `Label ${lid} not found in this project or organization.`,
              );
            }
          }

          // Remove those not in target
          const toRemove = [...currentLabelSet].filter(
            (lid) => !targetSet.has(lid),
          );
          if (toRemove.length > 0) {
            await tx
              .delete(taskLabels)
              .where(
                and(
                  eq(taskLabels.taskId, task.id),
                  inArray(taskLabels.labelId, toRemove),
                ),
              );
          }

          // Add those not in current
          const toAdd = [...targetSet].filter(
            (lid) => !currentLabelSet.has(lid),
          );
          for (const labelId of toAdd) {
            await tx
              .insert(taskLabels)
              .values({ taskId: task.id, labelId })
              .onConflictDoNothing();
          }

          if (toRemove.length > 0 || toAdd.length > 0) {
            operations.push("labels");
          }
        } else {
          // Add/remove operations
          if (update.labels.remove && update.labels.remove.length > 0) {
            await tx
              .delete(taskLabels)
              .where(
                and(
                  eq(taskLabels.taskId, task.id),
                  inArray(taskLabels.labelId, update.labels.remove),
                ),
              );
            operations.push("labels");
          }

          if (update.labels.add && update.labels.add.length > 0) {
            for (const labelRef of update.labels.add) {
              const labelId = await resolveLabelId(
                tx,
                labelRef,
                ctx,
                labelByIdMap,
                labelByNameMap,
              );

              if (!currentLabelSet.has(labelId)) {
                await tx
                  .insert(taskLabels)
                  .values({ taskId: task.id, labelId })
                  .onConflictDoNothing();
              }
            }
            if (!operations.includes("labels")) {
              operations.push("labels");
            }
          }
        }
      }

      updateResults.push({
        id: task.id,
        number: task.number,
        title: (combinedPatch.content as string) ?? task.content,
        priority: (combinedPatch.priority as string) ?? task.priority,
        dueDate:
          combinedPatch.dueDate !== undefined
            ? (combinedPatch.dueDate as string | null)
            : task.dueDate,
        columnId: newColumnId,
        columnIndex: newColumnIndex,
        operations,
      });
    }

    return updateResults;
  });

  return {
    updatedCount: results.length,
    tasks: results,
    affectedIds: results.map((t) => t.id),
    snapshotBefore,
  };
}

/**
 * Resolve a label reference to an ID, creating if necessary.
 */
async function resolveLabelId(
  tx: Parameters<Parameters<typeof dbPool.transaction>[0]>[0],
  labelRef: LabelAdd,
  ctx: WriteToolContext,
  labelByIdMap: Map<string, { id: string; name: string }>,
  labelByNameMap: Map<string, { id: string; name: string }>,
): Promise<string> {
  if (labelRef.labelId) {
    const existing = labelByIdMap.get(labelRef.labelId);
    if (!existing) {
      throw new Error(
        `Label ${labelRef.labelId} not found in this project or organization.`,
      );
    }
    return existing.id;
  }

  const labelName = labelRef.labelName!.trim();
  const existing = labelByNameMap.get(labelName.toLowerCase());

  if (existing) {
    return existing.id;
  }

  if (labelRef.createIfMissing) {
    const [newLabel] = await tx
      .insert(labels)
      .values({
        name: labelName,
        color: labelRef.labelColor ?? "blue",
        projectId: ctx.projectId,
      })
      .returning({ id: labels.id, name: labels.name });

    // Add to map for subsequent operations
    labelByNameMap.set(labelName.toLowerCase(), newLabel);
    return newLabel.id;
  }

  throw new Error(`Label "${labelName}" not found.`);
}
