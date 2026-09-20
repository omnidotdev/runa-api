import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { randomUUID } from "node:crypto";

import { Pool } from "pg";

import { moveTask } from "../moveTask";

/**
 * Integration test for moveTask against a real Postgres (DATABASE_URL). Verifies
 * number reassignment, target-column placement, project-scoped label cleanup, and
 * cross-workspace rejection
 */
const DATABASE_URL = process.env.DATABASE_URL;

const pool = new Pool({ connectionString: DATABASE_URL });

const orgA = `org-a-${randomUUID()}`;
const orgB = `org-b-${randomUUID()}`;
const ids = {
  pcA: randomUUID(),
  pcB: randomUUID(),
  projA: randomUUID(),
  projB: randomUUID(),
  projOther: randomUUID(),
  pcOther: randomUUID(),
  colA: randomUUID(),
  colB: randomUUID(),
  colOther: randomUUID(),
  task: randomUUID(),
  labelProjA: randomUUID(),
  labelOrg: randomUUID(),
};

const seedProjectColumn = async (id: string, org: string) =>
  pool.query(
    `INSERT INTO project_column (id, title, organization_id, index) VALUES ($1,$2,$3,'a0')`,
    [id, `Group-${id}`, org],
  );

const seedProject = async (
  id: string,
  org: string,
  pcId: string,
  slug: string,
) =>
  pool.query(
    `INSERT INTO project (id, name, slug, organization_id, project_column_id, column_index)
     VALUES ($1,$2,$3,$4,$5,'a0')`,
    [id, slug, slug, org, pcId],
  );

const seedColumn = async (id: string, projectId: string) =>
  pool.query(
    `INSERT INTO "column" (id, title, project_id, index) VALUES ($1,'To Do',$2,'a0')`,
    [id, projectId],
  );

const seedTask = async (id: string, projectId: string, columnId: string) =>
  pool.query(
    `INSERT INTO task (id, content, description, project_id, column_id, column_index)
     VALUES ($1,'Task','',$2,$3,'a0')`,
    [id, projectId, columnId],
  );

// Requires a live Postgres (migrated to current). Skips when DATABASE_URL is unset
// so it does not fail in a database-less CI run
describe.skipIf(!DATABASE_URL)("moveTask", () => {
  beforeAll(async () => {
    await seedProjectColumn(ids.pcA, orgA);
    await seedProjectColumn(ids.pcB, orgA);
    await seedProjectColumn(ids.pcOther, orgB);
    await seedProject(ids.projA, orgA, ids.pcA, `proj-a-${randomUUID()}`);
    await seedProject(ids.projB, orgA, ids.pcB, `proj-b-${randomUUID()}`);
    await seedProject(
      ids.projOther,
      orgB,
      ids.pcOther,
      `proj-o-${randomUUID()}`,
    );
    await seedColumn(ids.colA, ids.projA);
    await seedColumn(ids.colB, ids.projB);
    await seedColumn(ids.colOther, ids.projOther);
    await seedTask(ids.task, ids.projA, ids.colA);
    // project-scoped label on A + an org-scoped (workspace) label
    await pool.query(
      `INSERT INTO label (id, name, color, project_id) VALUES ($1,'ProjA','#111',$2)`,
      [ids.labelProjA, ids.projA],
    );
    await pool.query(
      `INSERT INTO label (id, name, color, organization_id) VALUES ($1,'Shared','#222',$2)`,
      [ids.labelOrg, orgA],
    );
    await pool.query(
      `INSERT INTO task_label (task_id, label_id) VALUES ($1,$2),($1,$3)`,
      [ids.task, ids.labelProjA, ids.labelOrg],
    );
  });

  afterAll(async () => {
    await pool.query(`DELETE FROM project WHERE id = ANY($1)`, [
      [ids.projA, ids.projB, ids.projOther],
    ]);
    await pool.query(`DELETE FROM project_column WHERE id = ANY($1)`, [
      [ids.pcA, ids.pcB, ids.pcOther],
    ]);
    await pool.end();
  });

  it("moves the task, reassigns its number, and cleans up project-scoped labels", async () => {
    const result = await moveTask(pool, {
      taskId: ids.task,
      targetProjectId: ids.projB,
      targetColumnId: ids.colB,
    });

    expect(result.projectId).toBe(ids.projB);
    expect(result.columnId).toBe(ids.colB);
    expect(result.number).toBe(1); // project B's first number
    expect(result.columnIndex.length).toBeGreaterThan(0);

    const taskRow = (
      await pool.query(
        `SELECT project_id, column_id, number FROM task WHERE id = $1`,
        [ids.task],
      )
    ).rows[0];
    expect(taskRow.project_id).toBe(ids.projB);
    expect(taskRow.column_id).toBe(ids.colB);
    expect(Number(taskRow.number)).toBe(1);

    // project-scoped label link dropped; workspace label kept
    const labelIds = (
      await pool.query(`SELECT label_id FROM task_label WHERE task_id = $1`, [
        ids.task,
      ])
    ).rows.map((r) => r.label_id);
    expect(labelIds).toContain(ids.labelOrg);
    expect(labelIds).not.toContain(ids.labelProjA);
  });

  it("rejects a cross-workspace move", async () => {
    await expect(
      moveTask(pool, {
        taskId: ids.task,
        targetProjectId: ids.projOther,
        targetColumnId: ids.colOther,
      }),
    ).rejects.toThrow("different workspace");
  });
});
