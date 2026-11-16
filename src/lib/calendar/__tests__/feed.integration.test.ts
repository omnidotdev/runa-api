/**
 * Integration tests for the project calendar feed builder against a real
 * Postgres (requires DATABASE_URL): only dated tasks become events, all-day ones
 * on their tolerant calendar day (nearest UTC midnight), titles as plain text,
 * the ICS carries the project name, and a missing project yields null.
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
      {
        // legacy all-day row stored at local midnight in UTC+1
        content: "Paris kickoff",
        description: "",
        projectId,
        columnId: col!.id,
        columnIndex: "a3",
        dueDate: "2026-10-20T00:00:00+01:00",
      },
      {
        // canonical all-day row at UTC midnight
        content: "Canonical deadline",
        description: "",
        projectId,
        columnId: col!.id,
        columnIndex: "a4",
        dueDate: "2026-10-21T00:00:00Z",
      },
      {
        // rich-text title from the web editor
        content:
          '<p dir="ltr"><span style="white-space: pre-wrap;">Fix login &amp; signup</span></p>',
        description: "",
        projectId,
        columnId: col!.id,
        columnIndex: "a5",
        dueDate: "2026-10-22T00:00:00Z",
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

  test("puts a local-midnight all-day date east of UTC on its intended day", async () => {
    const doc = (await buildProjectCalendarFeed(projectId)) as string;
    // stored as 2026-10-19T23:00Z; the UTC day alone would be a day early
    expect(doc).toContain("DTSTART;VALUE=DATE:20261020");
    expect(doc).not.toContain("DTSTART;VALUE=DATE:20261019");
  });

  test("puts a canonical UTC-midnight all-day date on that day", async () => {
    const doc = (await buildProjectCalendarFeed(projectId)) as string;
    expect(doc).toContain("DTSTART;VALUE=DATE:20261021");
  });

  test("publishes rich-text titles as plain text", async () => {
    const doc = (await buildProjectCalendarFeed(projectId)) as string;
    expect(doc).toContain("SUMMARY:Fix login & signup");
    expect(doc).not.toContain("<p");
    expect(doc).not.toContain("&amp;");
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
  const everyProject = async (projectIds: string[]) => new Set(projectIds);

  test("includes the user's dated assigned tasks across the workspace", async () => {
    const doc = await buildUserCalendarFeed(ORG, userId, everyProject);
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
      everyProject,
    );
    expect(doc).toContain("BEGIN:VCALENDAR");
    expect(doc).not.toContain("Ship the thing");
  });

  test("leaves out tasks in projects the user can no longer read", async () => {
    let asked: string[] = [];
    const doc = await buildUserCalendarFeed(ORG, userId, async (ids) => {
      asked = ids;
      return new Set<string>();
    });
    expect(asked).toEqual([projectId]);
    expect(doc).toContain("BEGIN:VCALENDAR");
    expect(doc).not.toContain("Ship the thing");
  });
});
