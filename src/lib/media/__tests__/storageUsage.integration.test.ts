/**
 * Integration test for per-workspace attachment storage accounting against a
 * real Postgres (requires DATABASE_URL). Regression: the sum was cast to `int`,
 * which overflows past ~2 GiB, so every upload 500'd once a workspace crossed
 * that point. Rows are scoped to a dedicated org and cleaned up afterwards
 */

import { afterAll, beforeAll, describe, expect, test } from "bun:test";

import { eq, inArray } from "drizzle-orm";

import { dbPool } from "lib/db/db";
import {
  attachments,
  columns,
  projectColumns,
  projects,
  tasks,
} from "lib/db/schema";
import { getOrganizationStorageBytes } from "lib/media/storageUsage";

const ORG = "org-storage-usage-test";
const EMPTY_ORG = "org-storage-usage-test-empty";

/** Largest value a Postgres `int` holds */
const INT_MAX = 2_147_483_647;

/** Per-row size near the `integer` column max, so two rows overflow an int sum */
const ROW_BYTES = 2_000_000_000;

let taskId: string;

const cleanup = async () => {
  await dbPool.delete(attachments).where(eq(attachments.organizationId, ORG));
  const orgProjects = await dbPool
    .select({ id: projects.id })
    .from(projects)
    .where(eq(projects.organizationId, ORG));
  if (orgProjects.length) {
    // Cascades to the project's columns and tasks
    await dbPool.delete(projects).where(
      inArray(
        projects.id,
        orgProjects.map((p) => p.id),
      ),
    );
  }
  await dbPool
    .delete(projectColumns)
    .where(eq(projectColumns.organizationId, ORG));
};

beforeAll(async () => {
  await cleanup();

  const [pc] = await dbPool
    .insert(projectColumns)
    .values({ title: "Todo", organizationId: ORG, index: "a0" })
    .returning({ id: projectColumns.id });
  const [project] = await dbPool
    .insert(projects)
    .values({
      name: "Storage",
      slug: `storage-${Math.random().toString(36).slice(2)}`,
      organizationId: ORG,
      projectColumnId: pc!.id,
      columnIndex: "a0",
    })
    .returning({ id: projects.id });
  const [col] = await dbPool
    .insert(columns)
    .values({ title: "Todo", projectId: project!.id, index: "a0" })
    .returning({ id: columns.id });
  const [task] = await dbPool
    .insert(tasks)
    .values({
      content: "Big files",
      description: "",
      projectId: project!.id,
      columnId: col!.id,
      columnIndex: "a0",
    })
    .returning({ id: tasks.id });
  taskId = task!.id;
});

afterAll(cleanup);

describe("getOrganizationStorageBytes", () => {
  test("returns 0 for a workspace with no attachments", async () => {
    expect(await getOrganizationStorageBytes(EMPTY_ORG)).toBe(0);
  });

  test("sums past the 32-bit int range without overflowing", async () => {
    await dbPool.insert(attachments).values(
      [0, 1].map((i) => ({
        taskId,
        organizationId: ORG,
        filename: `big-${i}.bin`,
        mimeType: "application/octet-stream",
        fileSize: ROW_BYTES,
        kind: "file",
        storageKey: `runa/${ORG}/${taskId}/big-${i}.bin`,
        url: `/api/attachments/file/big-${i}.bin`,
      })),
    );

    const total = await getOrganizationStorageBytes(ORG);

    expect(total).toBe(2 * ROW_BYTES);
    expect(total).toBeGreaterThan(INT_MAX);
    expect(typeof total).toBe("number");
  });
});
