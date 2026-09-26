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

interface ConvertChecklistItemToTaskArgs {
  checklistItemId: string;
}

interface ConvertChecklistItemToTaskResult {
  id: string;
  number: number;
  content: string;
  projectId: string;
  columnId: string;
  columnIndex: string;
  sourceTaskId: string;
}

/**
 * Convert a checklist item into a standalone task, atomically on a single connection.
 *
 * The item's text becomes a new task in the FIRST column (lowest `index`) of the
 * origin task's project, appended to the end of that column, with `source_task_id`
 * pointing back at the origin task for traceability. The checklist item is then
 * deleted (replace semantics). The task-number trigger assigns `number` on insert.
 * Throws if the item, its origin task, or a target column cannot be found
 */
export const convertChecklistItemToTask = async (
  pool: PoolLike,
  { checklistItemId }: ConvertChecklistItemToTaskArgs,
): Promise<ConvertChecklistItemToTaskResult> => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const itemRes = await client.query(
      `SELECT ci.content, c.task_id, t.project_id
       FROM checklist_item ci
       JOIN checklist c ON c.id = ci.checklist_id
       JOIN task t ON t.id = c.task_id
       WHERE ci.id = $1`,
      [checklistItemId],
    );
    const item = itemRes.rows[0];
    if (!item) throw new Error("Checklist item not found");
    const content = item.content as string;
    const sourceTaskId = item.task_id as string;
    const projectId = item.project_id as string;

    // First column of the project (byte-order lex; columns use COLLATE "C")
    const colRes = await client.query(
      `SELECT id FROM "column" WHERE project_id = $1 ORDER BY index ASC LIMIT 1`,
      [projectId],
    );
    const columnId = colRes.rows[0]?.id as string | undefined;
    if (!columnId) throw new Error("Project has no columns");

    // Append to the end of the target column
    const idxRes = await client.query(
      `SELECT column_index FROM task WHERE column_id = $1
       ORDER BY column_index DESC LIMIT 1`,
      [columnId],
    );
    const lastIndex =
      (idxRes.rows[0]?.column_index as string | undefined) ?? null;
    const columnIndex = generateKeyBetween(lastIndex, null);

    // Insert the new task; `number` is assigned by the on-insert trigger
    const insertRes = await client.query(
      `INSERT INTO task (content, description, project_id, column_id, column_index, source_task_id)
       VALUES ($1, '', $2, $3, $4, $5)
       RETURNING id, number, content, project_id, column_id, column_index, source_task_id`,
      [content, projectId, columnId, columnIndex, sourceTaskId],
    );
    const row = insertRes.rows[0];
    if (!row) throw new Error("Failed to create task");

    await client.query(`DELETE FROM checklist_item WHERE id = $1`, [
      checklistItemId,
    ]);

    await client.query("COMMIT");

    return {
      id: row.id as string,
      number: Number(row.number),
      content: row.content as string,
      projectId: row.project_id as string,
      columnId: row.column_id as string,
      columnIndex: row.column_index as string,
      sourceTaskId: row.source_task_id as string,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};
