/**
 * Integration tests for the project calendar feed builder against a real
 * Postgres (requires DATABASE_URL): only dated tasks become events, each on its
 * UTC day, the ICS carries the project name, and a missing project yields null.
 */

import { afterAll, beforeAll, describe, expect, test } from "bun:test";

import {
  buildProjectCalendarFeed,
  calendarFeedUrl,
  projectOrganizationId,
} from "lib/calendar/feed";
import { dbPool } from "lib/db/db";
import { columns, projectColumns, projects, tasks } from "lib/db/schema";

const ORG = "org-cal-feed";

let projectId: string;

beforeAll(async () => {
  await dbPool.delete(tasks);
  await dbPool.delete(columns);
  await dbPool.delete(projects);
  await dbPool.delete(projectColumns);

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

  await dbPool.insert(tasks).values([
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
  ]);
});

afterAll(async () => {
  await dbPool.delete(tasks);
  await dbPool.delete(columns);
  await dbPool.delete(projects);
  await dbPool.delete(projectColumns);
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
