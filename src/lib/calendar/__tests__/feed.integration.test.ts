/**
 * Integration tests for the project calendar feed builder against a real
 * Postgres (requires DATABASE_URL): only dated tasks become events, each on its
 * UTC day, the ICS carries the project name, and a missing project yields null.
 */

import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";

import {
  buildProjectCalendarFeed,
  buildUserCalendarFeed,
  calendarFeedUrl,
  projectOrganizationId,
} from "lib/calendar/feed";
import { dbPool } from "lib/db/db";
import {
  assignees,
  columns,
  projectColumns,
  projects,
  tasks,
  users,
} from "lib/db/schema";

const ORG = "org-cal-feed";

let projectId: string;
let userId: string;

beforeAll(async () => {
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
      name: "Launch Plan",
      slug: `launch-${Math.random().toString(36).slice(2)}`,
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

  const inserted = await dbPool
    .insert(tasks)
    .values([
      {
        content: "Ship the thing",
        description: "",
        projectId,
        columnId: col!.id,
        columnIndex: "a0",
        dueDate: "2026-10-14T00:00:00+00:00",
      },
      {
        content: "Someday maybe",
        description: "",
        projectId,
        columnId: col!.id,
        columnIndex: "a1",
        dueDate: null,
      },
      {
        content: "Standup",
        description: "",
        projectId,
        columnId: col!.id,
        columnIndex: "a2",
        dueDate: "2026-10-16T14:30:00+00:00",
        dueHasTime: true,
      },
    ])
    .returning({ id: tasks.id, content: tasks.content });

  const [user] = await dbPool
    .insert(users)
    .values({
      identityProviderId: randomUUID(),
      name: "Feed User",
      email: `feed-${Math.random().toString(36).slice(2)}@example.com`,
    })
    .returning({ id: users.id });
  userId = user!.id;

  // assign the user to the dated task only
  const datedTask = inserted.find((task) => task.content === "Ship the thing");
  await dbPool.insert(assignees).values({ taskId: datedTask!.id, userId });
});

afterAll(async () => {
  await dbPool.delete(assignees);
  await dbPool.delete(tasks);
  await dbPool.delete(columns);
  await dbPool.delete(projects);
  await dbPool.delete(projectColumns);
  await dbPool.delete(users);
});

describe("buildProjectCalendarFeed", () => {
  test("includes only dated tasks, each as an all-day event on its UTC day", async () => {
    const ics = await buildProjectCalendarFeed(projectId);
    expect(ics).not.toBeNull();
    const doc = ics as string;
    expect(doc).toContain("BEGIN:VCALENDAR");
    expect(doc).toContain("Launch Plan");
    // dated task present, on 2026-10-14
    expect(doc).toContain("Ship the thing");
    expect(doc).toContain("20261014");
    // undated task excluded
    expect(doc).not.toContain("Someday maybe");
  });

  test("emits a timed VEVENT for a task with a time-of-day", async () => {
    const doc = (await buildProjectCalendarFeed(projectId)) as string;
    // the all-day task stays an all-day VEVENT
    expect(doc).toContain("DTSTART;VALUE=DATE:20261014");
    // the timed task emits a UTC timed DTSTART/DTEND
    expect(doc).toContain("Standup");
    expect(doc).toContain("DTSTART:20261016T143000Z");
    expect(doc).toContain("DTEND:20261016T153000Z");
  });

  test("returns null for a project that does not exist", async () => {
    expect(
      await buildProjectCalendarFeed("00000000-0000-0000-0000-000000000000"),
    ).toBeNull();
  });
});

describe("projectOrganizationId", () => {
  test("returns the owning organization, or null when missing", async () => {
    expect(await projectOrganizationId(projectId)).toBe(ORG);
    expect(
      await projectOrganizationId("00000000-0000-0000-0000-000000000000"),
    ).toBeNull();
  });
});

describe("calendarFeedUrl", () => {
  test("embeds the token in the feed path", () => {
    expect(calendarFeedUrl("runa_cal_abc")).toContain(
      "/calendar/feed/runa_cal_abc",
    );
  });
});

describe("buildUserCalendarFeed", () => {
  test("includes the user's dated assigned tasks across the workspace", async () => {
    const doc = await buildUserCalendarFeed(ORG, userId);
    expect(doc).toContain("BEGIN:VCALENDAR");
    expect(doc).toContain("Ship the thing");
    expect(doc).toContain("20261014");
    // the undated task is not assigned to the user and has no due date
    expect(doc).not.toContain("Someday maybe");
  });

  test("is empty for a user with no assigned dated tasks", async () => {
    const doc = await buildUserCalendarFeed(
      ORG,
      "00000000-0000-0000-0000-000000000000",
    );
    expect(doc).toContain("BEGIN:VCALENDAR");
    expect(doc).not.toContain("Ship the thing");
  });
});
