/**
 * Integration tests for the public calendar feed route against a real Postgres
 * (requires DATABASE_URL). Exercises the capability-URL auth end to end via
 * Elysia's `.handle`: a live token serves the ICS with calendar content-type
 * and a private/no-store cache policy, a `.ics` suffix is tolerated, and an
 * unknown or revoked token returns a generic 404.
 */

import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";

import calendarFeedRoutes from "lib/calendar/feed.route";
import { dbPool } from "lib/db/db";
import {
  assignees,
  calendarFeedToken,
  columns,
  projectColumns,
  projects,
  tasks,
  users,
} from "lib/db/schema";
import {
  createCalendarFeedToken,
  createUserCalendarFeedToken,
  revokeCalendarFeedToken,
} from "lib/tokens/calendarFeedTokens";

const ORG = "org-cal-route";

let projectId: string;
let secret: string;
let userSecret: string;

const get = (path: string) =>
  calendarFeedRoutes.handle(new Request(`http://local${path}`));

beforeAll(async () => {
  await dbPool.delete(calendarFeedToken);
  await dbPool.delete(assignees);
  await dbPool.delete(tasks);
  await dbPool.delete(columns);
  await dbPool.delete(projects);
  await dbPool.delete(projectColumns);
  await dbPool.delete(users);

  const [pc] = await dbPool
    .insert(projectColumns)
    .values({ title: "Todo", organizationId: ORG, index: "a0" })
    .returning({ id: projectColumns.id });
  const [project] = await dbPool
    .insert(projects)
    .values({
      name: "Routed Project",
      slug: `routed-${Math.random().toString(36).slice(2)}`,
      organizationId: ORG,
      projectColumnId: pc!.id,
      columnIndex: "a0",
    })
    .returning({ id: projects.id });
  projectId = project!.id;

  const [col] = await dbPool
    .insert(columns)
    .values({ title: "Todo", projectId, index: "a0" })
    .returning({ id: columns.id });
  const [task] = await dbPool
    .insert(tasks)
    .values({
      content: "Routed task",
      description: "",
      projectId,
      columnId: col!.id,
      columnIndex: "a0",
      dueDate: "2026-11-02T00:00:00+00:00",
    })
    .returning({ id: tasks.id });

  const [user] = await dbPool
    .insert(users)
    .values({
      identityProviderId: randomUUID(),
      name: "Routed User",
      email: `routed-${Math.random().toString(36).slice(2)}@example.com`,
    })
    .returning({ id: users.id });
  await dbPool.insert(assignees).values({ taskId: task!.id, userId: user!.id });

  ({ secret } = await createCalendarFeedToken({
    organizationId: ORG,
    projectId,
    createdBy: "idp-admin",
  }));
  ({ secret: userSecret } = await createUserCalendarFeedToken({
    organizationId: ORG,
    userId: user!.id,
    createdBy: "idp-user",
  }));
});

afterAll(async () => {
  await dbPool.delete(calendarFeedToken);
  await dbPool.delete(assignees);
  await dbPool.delete(tasks);
  await dbPool.delete(columns);
  await dbPool.delete(projects);
  await dbPool.delete(projectColumns);
  await dbPool.delete(users);
});

describe("GET /calendar/feed/:token", () => {
  test("serves the ICS for a live token with private/no-store headers", async () => {
    const res = await get(`/calendar/feed/${secret}`);
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/calendar");
    expect(res.headers.get("cache-control")).toContain("no-store");
    const body = await res.text();
    expect(body).toContain("BEGIN:VCALENDAR");
    expect(body).toContain("Routed task");
    expect(body).toContain("20261102");
  });

  test("tolerates a trailing .ics extension on the token", async () => {
    const res = await get(`/calendar/feed/${secret}.ics`);
    expect(res.status).toBe(200);
    expect(await res.text()).toContain("BEGIN:VCALENDAR");
  });

  test("serves a user feed token's cross-project tasks", async () => {
    const res = await get(`/calendar/feed/${userSecret}`);
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/calendar");
    const body = await res.text();
    expect(body).toContain("BEGIN:VCALENDAR");
    expect(body).toContain("Routed task");
  });

  test("returns a generic 404 for an unknown token", async () => {
    const res = await get("/calendar/feed/runa_cal_nope");
    expect(res.status).toBe(404);
  });

  test("returns 404 once the token is revoked", async () => {
    await revokeCalendarFeedToken(projectId, ORG);
    const res = await get(`/calendar/feed/${secret}`);
    expect(res.status).toBe(404);
  });
});
