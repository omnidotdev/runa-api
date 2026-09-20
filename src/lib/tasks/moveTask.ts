import { generateKeyBetween } from "fractional-indexing";

/** Minimal pg client surface used within the transaction. */
interface PoolClientLike {
  query: (
    text: string,
    values?: unknown[],
  ) => Promise<{ rows: Array<Record<string, unknown>> }>;
  release: () => void;
}

/** Minimal pg pool surface (node-postgres Pool satisfies this). */
interface PoolLike {
  connect: () => Promise<PoolClientLike>;
}

interface MoveTaskArgs {
  taskId: string;
  targetProjectId: string;
  targetColumnId: string;
}

interface MoveTaskResult {
  id: string;
  number: number;
  projectId: string;
  columnId: string;
  columnIndex: string;
}

/**
 * Move a task to a column in another project, atomically on a single connection.
 *
 * The task-number trigger only fires on INSERT, so a moved task would keep its old
 * `number` and collide on the `(project_id, number)` unique constraint. We therefore
 * reassign `number` from the target project's counter, append the task to the end of
 * the target column (fractional index), and drop label links that were project-scoped
 * to the OLD project (workspace/org-scoped label links are kept). Assignees are
 * org-level and unaffected. Only same-workspace moves are allowed; a cross-workspace
 * move throws (task authorization is structural via project to org)
 */
export const moveTask = async (
  pool: PoolLike,
  { taskId, targetProjectId, targetColumnId }: MoveTaskArgs,
): Promise<MoveTaskResult> => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const taskRes = await client.query(
      `SELECT t.project_id, p.organization_id
       FROM task t JOIN project p ON p.id = t.project_id
       WHERE t.id = $1`,
      [taskId],
    );
    const task = taskRes.rows[0];
    if (!task) throw new Error("Task not found");
    const sourceProjectId = task.project_id as string;
    const sourceOrgId = task.organization_id as string;

    const colRes = await client.query(
      `SELECT c.project_id, p.organization_id
       FROM "column" c JOIN project p ON p.id = c.project_id
       WHERE c.id = $1`,
      [targetColumnId],
    );
    const col = colRes.rows[0];
    if (!col) throw new Error("Target column not found");
    if (col.project_id !== targetProjectId) {
      throw new Error("Target column does not belong to the target project");
    }
    if (col.organization_id !== sourceOrgId) {
      throw new Error("Cannot move a task to a different workspace");
    }

    // Reassign the task number from the target project's counter
    const numRes = await client.query(
      `UPDATE project SET next_task_number = next_task_number + 1
       WHERE id = $1 RETURNING next_task_number - 1 AS number`,
      [targetProjectId],
    );
    const newNumber = Number(numRes.rows[0]?.number ?? 1);

    // Append to the end of the target column
    const idxRes = await client.query(
      `SELECT column_index FROM task WHERE column_id = $1
       ORDER BY column_index DESC LIMIT 1`,
      [targetColumnId],
    );
    const lastIndex =
      (idxRes.rows[0]?.column_index as string | undefined) ?? null;
    const newIndex = generateKeyBetween(lastIndex, null);

    await client.query(
      `UPDATE task SET project_id = $1, column_id = $2, column_index = $3, number = $4
       WHERE id = $5`,
      [targetProjectId, targetColumnId, newIndex, newNumber, taskId],
    );

    // Drop label links scoped to the OLD project; keep workspace (org-scoped) labels
    await client.query(
      `DELETE FROM task_label
       WHERE task_id = $1
         AND label_id IN (SELECT id FROM label WHERE project_id = $2)`,
      [taskId, sourceProjectId],
    );

    await client.query("COMMIT");

    return {
      id: taskId,
      number: newNumber,
      projectId: targetProjectId,
      columnId: targetColumnId,
      columnIndex: newIndex,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};
