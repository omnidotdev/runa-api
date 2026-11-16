/**
 * Integration tests for request-time feed authorization against a real
 * Postgres (requires DATABASE_URL). The Warden check is injected, so each test
 * states who can read what: a feed stops once its creator or owner loses
 * access, once its project is gone or in another workspace, and once its
 * workspace is deleted; a personal feed publishes only readable projects; and
 * an authorization outage is reported as unavailable, never as allowed.
 */

import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  test,
} from "bun:test";
import { randomUUID } from "node:crypto";

import { eq } from "drizzle-orm";

import { createCalendarFeedRoutes } from "lib/calendar/feed.route";
import { serveCalendarFeed } from "lib/calendar/feedAccess";
import { dbPool } from "lib/db/db";
import {
  assignees,
  calendarFeedToken,
  columns,
  projectColumns,
  projects,
  settings,
  tasks,
  users,
} from "lib/db/schema";
import {
  createCalendarFeedToken,
  createUserCalendarFeedToken,
  resolveCalendarFeedToken,
} from "lib/tokens/calendarFeedTokens";

import type { FeedPermissionCheck } from "lib/calendar/feedAccess";
import type { ResolvedCalendarFeedToken } from "lib/tokens/calendarFeedTokens";

const ORG = "org-cal-access";
const ADMIN_IDP = "idp-cal-admin";

let openProjectId: string;
let closedProjectId: string;
let userIdpId: string;
let projectToken: ResolvedCalendarFeedToken;
let userToken: ResolvedCalendarFeedToken;
let projectSecret: string;

/** Readable resources, as `<type>:<id>` keys, per identity-provider user */
let grants: Map<string, Set<string>>;

const check: FeedPermissionCheck = async ({
  userId,
  resourceType,
  resourceId,
}) => grants.get(userId)?.has(`${resourceType}:${resourceId}`) ?? false;

const failingCheck: FeedPermissionCheck = async () => {
  throw new Error("AuthZ check failed: 503");
};

const clearTables = async () => {
  await dbPool.delete(calendarFeedToken);
  await dbPool.delete(assignees);
  await dbPool.delete(tasks);
  await dbPool.delete(columns);
  await dbPool.delete(projects);
  await dbPool.delete(projectColumns);
  await dbPool.delete(settings);
  await dbPool.delete(users);
};

const insertProject = async (name: string, statusColumnId: string) => {
  const [project] = await dbPool
    .insert(projects)
    .values({
      name,
      slug: `${name.toLowerCase().replace(/\s+/g, "-")}-${Math.random().toString(36).slice(2)}`,
      organizationId: ORG,
      projectColumnId: statusColumnId,
      columnIndex: "a0",
    })
    .returning({ id: projects.id });
  const [column] = await dbPool
    .insert(columns)
    .values({ title: "Todo", projectId: project!.id, index: "a0" })
    .returning({ id: columns.id });
  return { projectId: project!.id, columnId: column!.id };
};

beforeAll(async () => {
  await clearTables();

  const [pc] = await dbPool
    .insert(projectColumns)
    .values({ title: "Todo", organizationId: ORG, index: "a0" })
    .returning({ id: projectColumns.id });
  await dbPool.insert(settings).values({ organizationId: ORG });

  const open = await insertProject("Open Board", pc!.id);
  const closed = await insertProject("Closed Board", pc!.id);
  openProjectId = open.projectId;
  closedProjectId = closed.projectId;

  userIdpId = randomUUID();
  const [user] = await dbPool
    .insert(users)
    .values({
      identityProviderId: userIdpId,
      name: "Access User",
      email: `access-${Math.random().toString(36).slice(2)}@example.com`,
    })
    .returning({ id: users.id });

  const inserted = await dbPool
    .insert(tasks)
    .values([
      {
        content: "Open task",
        description: "",
        projectId: openProjectId,
        columnId: open.columnId,
        columnIndex: "a0",
        dueDate: "2026-11-02T00:00:00Z",
      },
      {
        content: "Closed task",
        description: "",
        projectId: closedProjectId,
        columnId: closed.columnId,
        columnIndex: "a0",
        dueDate: "2026-11-03T00:00:00Z",
      },
    ])
    .returning({ id: tasks.id });
  await dbPool
    .insert(assignees)
    .values(inserted.map((task) => ({ taskId: task.id, userId: user!.id })));

  ({ secret: projectSecret } = await createCalendarFeedToken({
    organizationId: ORG,
    projectId: openProjectId,
    createdBy: ADMIN_IDP,
  }));
  const { secret: userSecret } = await createUserCalendarFeedToken({
    organizationId: ORG,
    userId: user!.id,
    createdBy: userIdpId,
  });
  projectToken = (await resolveCalendarFeedToken(projectSecret))!;
  userToken = (await resolveCalendarFeedToken(userSecret))!;
});

beforeEach(async () => {
  // by default the admin reads the open board and the user is a member who
  // reads both boards
  grants = new Map([
    [ADMIN_IDP, new Set([`project:${openProjectId}`])],
    [
      userIdpId,
      new Set([
        `organization:${ORG}`,
        `project:${openProjectId}`,
        `project:${closedProjectId}`,
      ]),
    ],
  ]);
  await dbPool
    .update(settings)
    .set({ deletedAt: null, deletionReason: null })
    .where(eq(settings.organizationId, ORG));
});

afterAll(clearTables);

describe("serveCalendarFeed: project feed", () => {
  test("serves the feed while the creator can read the project", async () => {
    const result = await serveCalendarFeed(projectToken, check);
    expect(result.status).toBe("ok");
    expect(result.status === "ok" && result.ics).toContain("Open task");
  });

  test("stops once the creator loses access to the project", async () => {
    grants.set(ADMIN_IDP, new Set());
    expect(await serveCalendarFeed(projectToken, check)).toEqual({
      status: "not_found",
    });
  });

  test("stops once the workspace is deleted", async () => {
    await dbPool
      .update(settings)
      .set({ deletedAt: new Date(), deletionReason: "organization_deleted" })
      .where(eq(settings.organizationId, ORG));
    expect(await serveCalendarFeed(projectToken, check)).toEqual({
      status: "not_found",
    });
  });

  test("stops when the project is not in the token's workspace", async () => {
    expect(
      await serveCalendarFeed(
        { ...projectToken, organizationId: "org-elsewhere" },
        check,
      ),
    ).toEqual({ status: "not_found" });
  });

  test("stops when the project no longer exists", async () => {
    expect(
      await serveCalendarFeed(
        { ...projectToken, projectId: "00000000-0000-0000-0000-000000000000" },
        check,
      ),
    ).toEqual({ status: "not_found" });
  });

  test("reports an authorization outage as unavailable", async () => {
    expect(await serveCalendarFeed(projectToken, failingCheck)).toEqual({
      status: "unavailable",
    });
  });
});

describe("serveCalendarFeed: personal feed", () => {
  test("serves every readable project's assigned dated tasks", async () => {
    const result = await serveCalendarFeed(userToken, check);
    expect(result.status).toBe("ok");
    const ics = result.status === "ok" ? result.ics : "";
    expect(ics).toContain("Open task");
    expect(ics).toContain("Closed task");
  });

  test("leaves out projects the owner can no longer read", async () => {
    grants.get(userIdpId)?.delete(`project:${closedProjectId}`);
    const result = await serveCalendarFeed(userToken, check);
    const ics = result.status === "ok" ? result.ics : "";
    expect(ics).toContain("Open task");
    expect(ics).not.toContain("Closed task");
  });

  test("stops once the owner is removed from the workspace", async () => {
    grants.set(userIdpId, new Set());
    expect(await serveCalendarFeed(userToken, check)).toEqual({
      status: "not_found",
    });
  });

  test("stops once the workspace is deleted", async () => {
    await dbPool
      .update(settings)
      .set({ deletedAt: new Date(), deletionReason: "organization_deleted" })
      .where(eq(settings.organizationId, ORG));
    expect(await serveCalendarFeed(userToken, check)).toEqual({
      status: "not_found",
    });
  });

  test("reports an authorization outage as unavailable", async () => {
    expect(await serveCalendarFeed(userToken, failingCheck)).toEqual({
      status: "unavailable",
    });
  });
});

describe("GET /calendar/feed/:token authorization", () => {
  const get = (routes: ReturnType<typeof createCalendarFeedRoutes>) =>
    routes.handle(new Request(`http://local/calendar/feed/${projectSecret}`));

  test("returns a generic, uncached 404 once access is lost", async () => {
    grants.set(ADMIN_IDP, new Set());
    const res = await get(createCalendarFeedRoutes(() => check));
    expect(res.status).toBe(404);
    expect(res.headers.get("cache-control")).toContain("no-store");
    expect(await res.text()).toBe("Not found");
  });

  test("returns an uncached 503 when access cannot be checked", async () => {
    const res = await get(createCalendarFeedRoutes(() => failingCheck));
    expect(res.status).toBe(503);
    expect(res.headers.get("cache-control")).toContain("no-store");
  });
});
