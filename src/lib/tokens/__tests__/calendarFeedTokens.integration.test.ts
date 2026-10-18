/**
 * Integration tests for the calendar feed token service against a real Postgres
 * (requires DATABASE_URL): the plaintext is returned once and only its hash is
 * stored, resolve round-trips a live token to its project, regenerating revokes
 * the prior URL, and revoke + org scoping behave.
 */

import { afterAll, beforeEach, describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";

import { dbPool } from "lib/db/db";
import {
  calendarFeedToken,
  projectColumns,
  projects,
  users,
} from "lib/db/schema";
import {
  createCalendarFeedToken,
  createUserCalendarFeedToken,
  getCalendarFeedToken,
  getUserCalendarFeedToken,
  resolveCalendarFeedToken,
  revokeCalendarFeedToken,
  revokeUserCalendarFeedToken,
} from "lib/tokens/calendarFeedTokens";

const ORG = "org-a";
const OTHER_ORG = "org-b";

let projectId: string;
let userId: string;

/** Seed a user and return its row id. */
const seedUser = async (): Promise<string> => {
  const suffix = Math.random().toString(36).slice(2);
  const [user] = await dbPool
    .insert(users)
    .values({
      identityProviderId: randomUUID(),
      name: "Cal User",
      email: `cal-${suffix}@example.com`,
    })
    .returning({ id: users.id });
  return user!.id;
};

/** Seed a project (and its required column) and return the project id. */
const seedProject = async (organizationId: string): Promise<string> => {
  const [col] = await dbPool
    .insert(projectColumns)
    .values({ title: "Todo", organizationId, index: "a0" })
    .returning({ id: projectColumns.id });
  const [project] = await dbPool
    .insert(projects)
    .values({
      name: "Calendar Project",
      slug: `cal-${Math.random().toString(36).slice(2)}`,
      organizationId,
      projectColumnId: col!.id,
      columnIndex: "a0",
    })
    .returning({ id: projects.id });
  return project!.id;
};

beforeEach(async () => {
  await dbPool.delete(calendarFeedToken);
  await dbPool.delete(projects);
  await dbPool.delete(projectColumns);
  await dbPool.delete(users);
  projectId = await seedProject(ORG);
  userId = await seedUser();
});

afterAll(async () => {
  await dbPool.delete(calendarFeedToken);
  await dbPool.delete(projects);
  await dbPool.delete(projectColumns);
  await dbPool.delete(users);
});

describe("createCalendarFeedToken", () => {
  test("returns a runa_cal_ plaintext once and stores only its hash", async () => {
    const { token, secret } = await createCalendarFeedToken({
      organizationId: ORG,
      projectId,
      createdBy: "idp-admin",
    });
    expect(secret.startsWith("runa_cal_")).toBe(true);
    expect(token).not.toHaveProperty("secret");
    expect(token).not.toHaveProperty("tokenHash");
    const [stored] = await dbPool.select().from(calendarFeedToken);
    expect(stored!.tokenHash).not.toBe(secret);
    expect(stored!.projectId).toBe(projectId);
  });
});

describe("resolveCalendarFeedToken", () => {
  test("round-trips a live token to its project", async () => {
    const { secret } = await createCalendarFeedToken({
      organizationId: ORG,
      projectId,
      createdBy: "idp-admin",
    });
    const resolved = await resolveCalendarFeedToken(secret);
    expect(resolved).not.toBeNull();
    expect(resolved?.projectId).toBe(projectId);
    expect(resolved?.organizationId).toBe(ORG);
  });

  test("returns null for a non-feed token or unknown token", async () => {
    expect(await resolveCalendarFeedToken("runa_not_a_feed_token")).toBeNull();
    expect(await resolveCalendarFeedToken("runa_cal_bogus")).toBeNull();
  });
});

describe("regeneration", () => {
  test("creating a new token revokes the prior one (old URL stops working)", async () => {
    const first = await createCalendarFeedToken({
      organizationId: ORG,
      projectId,
      createdBy: "idp-admin",
    });
    const second = await createCalendarFeedToken({
      organizationId: ORG,
      projectId,
      createdBy: "idp-admin",
    });
    // the prior secret no longer resolves; the new one does
    expect(await resolveCalendarFeedToken(first.secret)).toBeNull();
    expect(await resolveCalendarFeedToken(second.secret)).not.toBeNull();
    // only one live token for the project
    const live = await getCalendarFeedToken(projectId, ORG);
    expect(live?.id).toBe(second.token.id);
  });
});

describe("revokeCalendarFeedToken", () => {
  test("revokes a live token and reports it", async () => {
    const { secret } = await createCalendarFeedToken({
      organizationId: ORG,
      projectId,
      createdBy: "idp-admin",
    });
    expect(await revokeCalendarFeedToken(projectId, ORG)).toBe(true);
    expect(await resolveCalendarFeedToken(secret)).toBeNull();
    expect(await getCalendarFeedToken(projectId, ORG)).toBeNull();
    // nothing live to revoke the second time
    expect(await revokeCalendarFeedToken(projectId, ORG)).toBe(false);
  });

  test("does not revoke across organizations", async () => {
    const { secret } = await createCalendarFeedToken({
      organizationId: ORG,
      projectId,
      createdBy: "idp-admin",
    });
    // a different org cannot revoke this project's token
    expect(await revokeCalendarFeedToken(projectId, OTHER_ORG)).toBe(false);
    expect(await resolveCalendarFeedToken(secret)).not.toBeNull();
  });
});

describe("user calendar feed tokens", () => {
  test("create returns a runa_cal_ secret once and resolves to the user", async () => {
    const { token, secret } = await createUserCalendarFeedToken({
      organizationId: ORG,
      userId,
      createdBy: "idp-user",
    });
    expect(secret.startsWith("runa_cal_")).toBe(true);
    expect(token).not.toHaveProperty("secret");

    const resolved = await resolveCalendarFeedToken(secret);
    expect(resolved?.userId).toBe(userId);
    expect(resolved?.projectId).toBeNull();
    expect(resolved?.organizationId).toBe(ORG);
  });

  test("regenerating revokes the prior user token", async () => {
    const first = await createUserCalendarFeedToken({
      organizationId: ORG,
      userId,
      createdBy: "idp-user",
    });
    const second = await createUserCalendarFeedToken({
      organizationId: ORG,
      userId,
      createdBy: "idp-user",
    });
    expect(await resolveCalendarFeedToken(first.secret)).toBeNull();
    expect(await resolveCalendarFeedToken(second.secret)).not.toBeNull();
    expect((await getUserCalendarFeedToken(userId, ORG))?.id).toBe(
      second.token.id,
    );
  });

  test("revoke + org scoping", async () => {
    const { secret } = await createUserCalendarFeedToken({
      organizationId: ORG,
      userId,
      createdBy: "idp-user",
    });
    // a different org cannot revoke this user's token
    expect(await revokeUserCalendarFeedToken(userId, OTHER_ORG)).toBe(false);
    expect(await revokeUserCalendarFeedToken(userId, ORG)).toBe(true);
    expect(await resolveCalendarFeedToken(secret)).toBeNull();
    expect(await getUserCalendarFeedToken(userId, ORG)).toBeNull();
  });
});
