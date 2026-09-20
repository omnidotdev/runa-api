import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { randomUUID } from "node:crypto";

import { Pool } from "pg";

import { _pollDigestQueueOnce, enqueueAssignmentDigest } from "../digestQueue";

/**
 * Integration test for the assignment-email digest queue against a real Postgres
 * (DATABASE_URL). Herald is unconfigured in tests, so the notifications provider
 * is a noop that returns without throwing; the poller therefore treats a claimed
 * batch as "sent" and deletes it, which is what these assertions check. Skips
 * when DATABASE_URL is unset so it does not fail a database-less CI run
 */
const DATABASE_URL = process.env.DATABASE_URL;

const pool = new Pool({ connectionString: DATABASE_URL });

const userA = randomUUID();
const userB = randomUUID();

const seedUser = async (id: string) =>
  pool.query(
    `INSERT INTO "user" (id, identity_provider_id, name, email)
     VALUES ($1, $2, $3, $4)`,
    [id, randomUUID(), `User ${id.slice(0, 8)}`, `${id}@example.test`],
  );

const insertDigestRow = async (userId: string, sendAfter: string, to: string) =>
  pool.query(
    `INSERT INTO notification_digest_queue (user_id, payload, send_after)
     VALUES ($1, $2, $3)`,
    [
      userId,
      JSON.stringify({
        to,
        taskTitle: "A task",
        taskDisplayKey: "API-1",
        projectName: "Proj",
        taskUrl: null,
        manageUrl: null,
      }),
      sendAfter,
    ],
  );

const countRows = async (userId: string): Promise<number> => {
  const { rows } = await pool.query(
    "SELECT count(*)::int AS n FROM notification_digest_queue WHERE user_id = $1",
    [userId],
  );
  return Number(rows[0]?.n ?? 0);
};

describe.skipIf(!DATABASE_URL)("digest queue", () => {
  beforeAll(async () => {
    await seedUser(userA);
    await seedUser(userB);
  });

  afterAll(async () => {
    await pool.query(`DELETE FROM "user" WHERE id = ANY($1)`, [[userA, userB]]);
    await pool.end();
  });

  it("enqueues with a future send window", async () => {
    await enqueueAssignmentDigest(userA, {
      to: `${userA}@example.test`,
      taskTitle: "Task",
      taskDisplayKey: "API-2",
      projectName: "Proj",
      taskUrl: null,
      manageUrl: null,
    });

    const { rows } = await pool.query(
      "SELECT send_after FROM notification_digest_queue WHERE user_id = $1",
      [userA],
    );
    expect(rows.length).toBe(1);
    expect(new Date(rows[0].send_after as string).getTime()).toBeGreaterThan(
      Date.now(),
    );

    // clean up so the poll test starts from a known state
    await pool.query(
      "DELETE FROM notification_digest_queue WHERE user_id = $1",
      [userA],
    );
  });

  it("sends and clears due rows, grouped by user, leaving future rows", async () => {
    const past = new Date(Date.now() - 60_000).toISOString();
    const future = new Date(Date.now() + 60 * 60_000).toISOString();

    await insertDigestRow(userA, past, `${userA}@example.test`);
    await insertDigestRow(userA, past, `${userA}@example.test`);
    await insertDigestRow(userA, future, `${userA}@example.test`);
    await insertDigestRow(userB, past, `${userB}@example.test`);

    await _pollDigestQueueOnce();

    // userA: the two due rows are sent+deleted, the future row remains
    expect(await countRows(userA)).toBe(1);
    // userB: the single due row is sent+deleted
    expect(await countRows(userB)).toBe(0);
  });
});
