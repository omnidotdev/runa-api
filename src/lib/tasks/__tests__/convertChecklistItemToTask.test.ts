import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { randomUUID } from "node:crypto";

import { Pool } from "pg";

import { convertChecklistItemToTask } from "../convertChecklistItemToTask";

/**
 * Integration test for convertChecklistItemToTask against a real Postgres
 * (DATABASE_URL). Verifies the new task lands in the project's FIRST column, links
 * back via source_task_id, carries the item's content, and that the item is removed
 */
const DATABASE_URL = process.env.DATABASE_URL;

const pool = new Pool({ connectionString: DATABASE_URL });

const org = `org-${randomUUID()}`;
const ids = {
  pc: randomUUID(),
  proj: randomUUID(),
  colFirst: randomUUID(),
  colSecond: randomUUID(),
  task: randomUUID(),
  checklist: randomUUID(),
  item: randomUUID(),
};

const seedProjectColumn = async (id: string, orgId: string) =>
  pool.query(
    `INSERT INTO project_column (id, title, organization_id, index) VALUES ($1,$2,$3,'a0')`,
    [id, `Group-${id}`, orgId],
  );

const seedProject = async (id: string, orgId: string, pcId: string) =>
  pool.query(
    `INSERT INTO project (id, name, slug, organization_id, project_column_id, column_index)
     VALUES ($1,$2,$2,$3,$4,'a0')`,
    [id, `proj-${randomUUID()}`, orgId, pcId],
  );

const seedColumn = async (id: string, projectId: string, index: string) =>
  pool.query(
    `INSERT INTO "column" (id, title, project_id, index) VALUES ($1,'Col',$2,$3)`,
    [id, projectId, index],
  );

const seedTask = async (id: string, projectId: string, columnId: string) =>
  pool.query(
    `INSERT INTO task (id, content, description, project_id, column_id, column_index)
     VALUES ($1,'Origin','',$2,$3,'a0')`,
    [id, projectId, columnId],
  );

// Requires a live Postgres (migrated to current). Skips when DATABASE_URL is unset
// so it does not fail in a database-less CI run
describe.skipIf(!DATABASE_URL)("convertChecklistItemToTask", () => {
  beforeAll(async () => {
    await seedProjectColumn(ids.pc, org);
    await seedProject(ids.proj, org, ids.pc);
    // First column has the lowest index; origin task lives in the SECOND column
    await seedColumn(ids.colFirst, ids.proj, "a0");
    await seedColumn(ids.colSecond, ids.proj, "a1");
    await seedTask(ids.task, ids.proj, ids.colSecond);
    await pool.query(
      `INSERT INTO checklist (id, task_id, title, index) VALUES ($1,$2,'Checklist','a0')`,
      [ids.checklist, ids.task],
    );
    await pool.query(
      `INSERT INTO checklist_item (id, checklist_id, content, index) VALUES ($1,$2,'Ship dark mode','a0')`,
      [ids.item, ids.checklist],
    );
  });

  afterAll(async () => {
    await pool.query(`DELETE FROM project WHERE id = $1`, [ids.proj]);
    await pool.query(`DELETE FROM project_column WHERE id = $1`, [ids.pc]);
    await pool.end();
  });

  it("creates a task in the first column, links back, and removes the item", async () => {
    const result = await convertChecklistItemToTask(pool, {
      checklistItemId: ids.item,
    });

    expect(result.content).toBe("Ship dark mode");
    expect(result.projectId).toBe(ids.proj);
    expect(result.columnId).toBe(ids.colFirst); // first column, not the origin's
    expect(result.sourceTaskId).toBe(ids.task);
    expect(result.number).toBeGreaterThan(0);
    expect(result.columnIndex.length).toBeGreaterThan(0);

    const taskRow = (
      await pool.query(
        `SELECT content, column_id, source_task_id FROM task WHERE id = $1`,
        [result.id],
      )
    ).rows[0];
    expect(taskRow.content).toBe("Ship dark mode");
    expect(taskRow.column_id).toBe(ids.colFirst);
    expect(taskRow.source_task_id).toBe(ids.task);

    // the item is gone
    const itemRows = (
      await pool.query(`SELECT id FROM checklist_item WHERE id = $1`, [
        ids.item,
      ])
    ).rows;
    expect(itemRows.length).toBe(0);
  });

  it("rejects a missing checklist item", async () => {
    await expect(
      convertChecklistItemToTask(pool, { checklistItemId: randomUUID() }),
    ).rejects.toThrow("Checklist item not found");
  });
});
