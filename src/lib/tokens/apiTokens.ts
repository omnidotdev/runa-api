/**
 * API token management + resolution service. Tokens are high-entropy random
 * strings (`runa_...`); only their SHA-256 hash is stored, so the plaintext is
 * recoverable only at creation. `resolveApiToken` is what the auth path will use
 * to turn a bearer token into a principal (built + tested now so wiring it in
 * later is a small, verified change); it returns null for unknown or revoked
 * tokens and records last use.
 */

import { createHash, randomBytes } from "node:crypto";

import { and, eq, isNull } from "drizzle-orm";

import { dbPool } from "lib/db/db";
import { apiToken } from "lib/db/schema";

import type { SelectApiToken } from "lib/db/schema";

const TOKEN_PREFIX = "runa_";

const hashToken = (plaintext: string): string =>
  createHash("sha256").update(plaintext).digest("hex");

/** Secret-less view of a token (safe to return/list). */
interface ApiTokenInfo {
  id: string;
  name: string;
  scopes: string[];
  createdAt: string;
  lastUsedAt: string | null;
  revoked: boolean;
}

const toInfo = (row: SelectApiToken): ApiTokenInfo => ({
  id: row.id,
  name: row.name,
  scopes: row.scopes,
  createdAt: row.createdAt,
  lastUsedAt: row.lastUsedAt,
  revoked: row.revokedAt !== null,
});

/** A resolved principal: what a valid bearer token authorizes. */
interface ResolvedApiToken {
  tokenId: string;
  organizationId: string;
  scopes: string[];
  createdBy: string;
}

/** Create a token; stores only its hash and returns the plaintext once. */
export const createApiToken = async (params: {
  organizationId: string;
  name: string;
  scopes: string[];
  createdBy: string;
}): Promise<{ token: ApiTokenInfo; secret: string }> => {
  const secret = `${TOKEN_PREFIX}${randomBytes(32).toString("base64url")}`;
  const [row] = await dbPool
    .insert(apiToken)
    .values({
      organizationId: params.organizationId,
      name: params.name,
      tokenHash: hashToken(secret),
      scopes: params.scopes,
      createdBy: params.createdBy,
    })
    .returning();
  return { token: toInfo(row!), secret };
};

/** Resolve the owning organization of a token (for the authz check). */
export const apiTokenOrganizationId = async (
  id: string,
): Promise<string | null> => {
  const [row] = await dbPool
    .select({ organizationId: apiToken.organizationId })
    .from(apiToken)
    .where(eq(apiToken.id, id));
  return row?.organizationId ?? null;
};

/** Revoke a token (org-scoped). Returns whether a live token was revoked. */
export const revokeApiToken = async (
  id: string,
  organizationId: string,
): Promise<boolean> => {
  const rows = await dbPool
    .update(apiToken)
    .set({ revokedAt: new Date().toISOString() })
    .where(
      and(
        eq(apiToken.id, id),
        eq(apiToken.organizationId, organizationId),
        isNull(apiToken.revokedAt),
      ),
    )
    .returning({ id: apiToken.id });
  return rows.length > 0;
};

/** List a workspace's tokens (secret-less). */
export const listApiTokens = async (
  organizationId: string,
): Promise<ApiTokenInfo[]> => {
  const rows = await dbPool
    .select()
    .from(apiToken)
    .where(eq(apiToken.organizationId, organizationId));
  return rows.map(toInfo);
};

/**
 * Turn a bearer token into a principal, or null if it is not a Runa token, is
 * unknown, or is revoked. Records last use. This is the resolver the auth path
 * will call; it does NOT itself grant access (the caller enforces scopes).
 */
export const resolveApiToken = async (
  plaintext: string,
): Promise<ResolvedApiToken | null> => {
  if (!plaintext.startsWith(TOKEN_PREFIX)) return null;
  const [row] = await dbPool
    .select()
    .from(apiToken)
    .where(
      and(
        eq(apiToken.tokenHash, hashToken(plaintext)),
        isNull(apiToken.revokedAt),
      ),
    );
  if (!row) return null;
  // best-effort last-use timestamp; never block auth on it
  dbPool
    .update(apiToken)
    .set({ lastUsedAt: new Date().toISOString() })
    .where(eq(apiToken.id, row.id))
    .catch(() => undefined);
  return {
    tokenId: row.id,
    organizationId: row.organizationId,
    scopes: row.scopes,
    createdBy: row.createdBy,
  };
};
