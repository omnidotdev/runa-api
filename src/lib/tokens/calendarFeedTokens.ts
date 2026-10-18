/**
 * Calendar feed token service. A project publishes a read-only iCalendar feed
 * that calendar clients subscribe to by URL; since those clients cannot send
 * auth headers, the credential is a dedicated capability token embedded in the
 * feed URL. Only the SHA-256 hash is stored, so the plaintext (`runa_cal_...`)
 * is recoverable only at creation. `resolveCalendarFeedToken` turns a feed
 * token into its project (the public feed route calls it); it returns null for
 * unknown or revoked tokens and records last use. A project has at most one
 * live token: creating a new one revokes any existing live token, so the old
 * feed URL stops working immediately (regenerate == rotate).
 */

import { createHash, randomBytes } from "node:crypto";

import { and, eq, isNull } from "drizzle-orm";

import { dbPool } from "lib/db/db";
import { calendarFeedToken } from "lib/db/schema";

import type { SelectCalendarFeedToken } from "lib/db/schema";

const TOKEN_PREFIX = "runa_cal_";

const hashToken = (plaintext: string): string =>
  createHash("sha256").update(plaintext).digest("hex");

/** Secret-less view of a live feed token (safe to return). */
interface CalendarFeedTokenInfo {
  id: string;
  projectId: string | null;
  userId: string | null;
  createdAt: string;
  lastUsedAt: string | null;
}

const toInfo = (row: SelectCalendarFeedToken): CalendarFeedTokenInfo => ({
  id: row.id,
  projectId: row.projectId,
  userId: row.userId,
  createdAt: row.createdAt,
  lastUsedAt: row.lastUsedAt,
});

/** What a resolved feed token grants read-only access to: one of project/user. */
interface ResolvedCalendarFeedToken {
  tokenId: string;
  organizationId: string;
  /** Set for a project feed; null for a user feed. */
  projectId: string | null;
  /** Set for a user feed; null for a project feed. */
  userId: string | null;
}

/** Revoke any live token for a project. Returns how many were revoked. */
const revokeLiveForProject = async (
  projectId: string,
  organizationId: string,
): Promise<number> => {
  const rows = await dbPool
    .update(calendarFeedToken)
    .set({ revokedAt: new Date().toISOString() })
    .where(
      and(
        eq(calendarFeedToken.projectId, projectId),
        eq(calendarFeedToken.organizationId, organizationId),
        isNull(calendarFeedToken.revokedAt),
      ),
    )
    .returning({ id: calendarFeedToken.id });
  return rows.length;
};

/**
 * Create (or regenerate) a project's feed token; stores only its hash and
 * returns the plaintext once. Revokes any existing live token first, so each
 * project has a single active feed URL.
 */
export const createCalendarFeedToken = async (params: {
  organizationId: string;
  projectId: string;
  createdBy: string;
}): Promise<{ token: CalendarFeedTokenInfo; secret: string }> => {
  await revokeLiveForProject(params.projectId, params.organizationId);
  const secret = `${TOKEN_PREFIX}${randomBytes(32).toString("base64url")}`;
  const [row] = await dbPool
    .insert(calendarFeedToken)
    .values({
      organizationId: params.organizationId,
      projectId: params.projectId,
      tokenHash: hashToken(secret),
      createdBy: params.createdBy,
    })
    .returning();
  return { token: toInfo(row!), secret };
};

/** Revoke a project's live feed token. Returns whether one was revoked. */
export const revokeCalendarFeedToken = async (
  projectId: string,
  organizationId: string,
): Promise<boolean> => {
  const revoked = await revokeLiveForProject(projectId, organizationId);
  return revoked > 0;
};

/** The live feed token for a project (secret-less), or null if none. */
export const getCalendarFeedToken = async (
  projectId: string,
  organizationId: string,
): Promise<CalendarFeedTokenInfo | null> => {
  const [row] = await dbPool
    .select()
    .from(calendarFeedToken)
    .where(
      and(
        eq(calendarFeedToken.projectId, projectId),
        eq(calendarFeedToken.organizationId, organizationId),
        isNull(calendarFeedToken.revokedAt),
      ),
    );
  return row ? toInfo(row) : null;
};

/**
 * Resolve a feed token to its project, or null if it is not a feed token, is
 * unknown, or is revoked. Records last use (best-effort). This grants only
 * read-only access to that one project's dated tasks.
 */
export const resolveCalendarFeedToken = async (
  plaintext: string,
): Promise<ResolvedCalendarFeedToken | null> => {
  if (!plaintext.startsWith(TOKEN_PREFIX)) return null;
  const [row] = await dbPool
    .select()
    .from(calendarFeedToken)
    .where(
      and(
        eq(calendarFeedToken.tokenHash, hashToken(plaintext)),
        isNull(calendarFeedToken.revokedAt),
      ),
    );
  if (!row) return null;
  // best-effort last-use timestamp; never block the feed on it
  dbPool
    .update(calendarFeedToken)
    .set({ lastUsedAt: new Date().toISOString() })
    .where(eq(calendarFeedToken.id, row.id))
    .catch(() => undefined);
  return {
    tokenId: row.id,
    organizationId: row.organizationId,
    projectId: row.projectId,
    userId: row.userId,
  };
};

/** Revoke any live token for a user. Returns how many were revoked. */
const revokeLiveForUser = async (
  userId: string,
  organizationId: string,
): Promise<number> => {
  const rows = await dbPool
    .update(calendarFeedToken)
    .set({ revokedAt: new Date().toISOString() })
    .where(
      and(
        eq(calendarFeedToken.userId, userId),
        eq(calendarFeedToken.organizationId, organizationId),
        isNull(calendarFeedToken.revokedAt),
      ),
    )
    .returning({ id: calendarFeedToken.id });
  return rows.length;
};

/**
 * Create (or regenerate) a user's personal feed token for a workspace; stores
 * only its hash and returns the plaintext once. Revokes any existing live token
 * first, so each (user, workspace) has a single active feed URL.
 */
export const createUserCalendarFeedToken = async (params: {
  organizationId: string;
  userId: string;
  createdBy: string;
}): Promise<{ token: CalendarFeedTokenInfo; secret: string }> => {
  await revokeLiveForUser(params.userId, params.organizationId);
  const secret = `${TOKEN_PREFIX}${randomBytes(32).toString("base64url")}`;
  const [row] = await dbPool
    .insert(calendarFeedToken)
    .values({
      organizationId: params.organizationId,
      userId: params.userId,
      tokenHash: hashToken(secret),
      createdBy: params.createdBy,
    })
    .returning();
  return { token: toInfo(row!), secret };
};

/** Revoke a user's live feed token for a workspace. */
export const revokeUserCalendarFeedToken = async (
  userId: string,
  organizationId: string,
): Promise<boolean> => {
  const revoked = await revokeLiveForUser(userId, organizationId);
  return revoked > 0;
};

/** The user's live feed token for a workspace (secret-less), or null. */
export const getUserCalendarFeedToken = async (
  userId: string,
  organizationId: string,
): Promise<CalendarFeedTokenInfo | null> => {
  const [row] = await dbPool
    .select()
    .from(calendarFeedToken)
    .where(
      and(
        eq(calendarFeedToken.userId, userId),
        eq(calendarFeedToken.organizationId, organizationId),
        isNull(calendarFeedToken.revokedAt),
      ),
    );
  return row ? toInfo(row) : null;
};
