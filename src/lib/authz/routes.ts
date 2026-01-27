import { Elysia, t } from "elysia";

import {
  AUTHZ_API_URL,
  AUTHZ_ENABLED,
  WARDEN_SERVICE_KEY,
} from "lib/config/env.config";
import { dbPool } from "lib/db/db";
import { projects } from "lib/db/schema";
import { deleteTuples, writeTuples } from "./sync";

interface TupleKey {
  user: string;
  relation: string;
  object: string;
}

/** Request timeout for PDP calls */
const REQUEST_TIMEOUT_MS = 10000;

/** Max tuples per page when reading from PDP */
const PDP_PAGE_SIZE = 200;

/**
 * Build expected tuples from Runa's source of truth.
 *
 * Tuple structure follows OpenFGA model:
 * - organization:{orgId} → organization → workspace:{orgId}
 * - workspace:{orgId} → workspace → project:{projectId}
 *
 * Note: Runa uses orgId as workspaceId (no separate workspace entity).
 * User→organization membership tuples are managed by IDP (Gatekeeper).
 */
async function buildExpectedTuples(): Promise<{
  orgWorkspaceTuples: TupleKey[];
  workspaceProjectTuples: TupleKey[];
}> {
  const allProjects = await dbPool
    .select({ id: projects.id, organizationId: projects.organizationId })
    .from(projects);

  // Unique organization IDs
  const orgIds = [...new Set(allProjects.map((p) => p.organizationId))];

  // organization:{orgId} → organization → workspace:{orgId}
  const orgWorkspaceTuples: TupleKey[] = orgIds.map((orgId) => ({
    user: `organization:${orgId}`,
    relation: "organization",
    object: `workspace:${orgId}`,
  }));

  // workspace:{orgId} → workspace → project:{projectId}
  const workspaceProjectTuples: TupleKey[] = allProjects.map((p) => ({
    user: `workspace:${p.organizationId}`,
    relation: "workspace",
    object: `project:${p.id}`,
  }));

  return { orgWorkspaceTuples, workspaceProjectTuples };
}

/**
 * Fetch all tuples from PDP with pagination.
 * Filters to Runa-managed object types (workspace, project).
 */
async function fetchAllTuplesFromPDP(): Promise<TupleKey[]> {
  if (!AUTHZ_API_URL || !WARDEN_SERVICE_KEY) {
    throw new Error("AUTHZ_API_URL and WARDEN_SERVICE_KEY required");
  }

  const allTuples: TupleKey[] = [];

  // Fetch workspace tuples (org→workspace relationships)
  let continuationToken: string | undefined;
  do {
    const params = new URLSearchParams({ pageSize: String(PDP_PAGE_SIZE) });
    if (continuationToken) {
      params.set("continuationToken", continuationToken);
    }

    const response = await fetch(
      `${AUTHZ_API_URL}/tuples?${params.toString()}`,
      {
        headers: { "X-Service-Key": WARDEN_SERVICE_KEY },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch tuples: ${response.status}`);
    }

    const data = (await response.json()) as {
      tuples: TupleKey[];
      continuationToken?: string;
    };

    // Filter to Runa-managed tuples only
    const runaTuples = data.tuples.filter(
      (t) =>
        // org→workspace tuples
        (t.object.startsWith("workspace:") && t.relation === "organization") ||
        // workspace→project tuples
        (t.object.startsWith("project:") && t.relation === "workspace"),
    );

    allTuples.push(...runaTuples);
    continuationToken = data.continuationToken;
  } while (continuationToken);

  return allTuples;
}

/**
 * Compare expected vs actual tuples and return drift.
 */
function computeDrift(
  expected: TupleKey[],
  actual: TupleKey[],
): { missing: TupleKey[]; orphaned: TupleKey[] } {
  const tupleKey = (t: TupleKey) => `${t.user}|${t.relation}|${t.object}`;
  const expectedKeys = new Set(expected.map(tupleKey));
  const actualKeys = new Set(actual.map(tupleKey));

  const missing = expected.filter((t) => !actualKeys.has(tupleKey(t)));
  const orphaned = actual.filter((t) => !expectedKeys.has(tupleKey(t)));

  return { missing, orphaned };
}

/**
 * Authorization routes for tuple export and reconciliation.
 */
const authzRoutes = new Elysia({ prefix: "/authz" })
  .get("/tuples", async () => {
    const { orgWorkspaceTuples, workspaceProjectTuples } =
      await buildExpectedTuples();

    const tuples = [...orgWorkspaceTuples, ...workspaceProjectTuples];

    return {
      tuples,
      count: tuples.length,
      breakdown: {
        orgWorkspace: orgWorkspaceTuples.length,
        workspaceProject: workspaceProjectTuples.length,
      },
      exportedAt: new Date().toISOString(),
    };
  })
  .get(
    "/drift",
    async ({ headers, set }) => {
      const serviceKey = headers["x-service-key"];
      if (!serviceKey || serviceKey !== WARDEN_SERVICE_KEY) {
        set.status = 401;
        return { error: "Invalid or missing service key" };
      }

      if (AUTHZ_ENABLED !== "true" || !AUTHZ_API_URL) {
        set.status = 400;
        return { error: "AuthZ is disabled or not configured" };
      }

      const { orgWorkspaceTuples, workspaceProjectTuples } =
        await buildExpectedTuples();
      const expectedTuples = [...orgWorkspaceTuples, ...workspaceProjectTuples];

      const actualTuples = await fetchAllTuplesFromPDP();
      const { missing, orphaned } = computeDrift(expectedTuples, actualTuples);

      return {
        expected: expectedTuples.length,
        actual: actualTuples.length,
        missing: missing.length,
        orphaned: orphaned.length,
        missingTuples: missing,
        orphanedTuples: orphaned,
        hasDrift: missing.length > 0 || orphaned.length > 0,
        checkedAt: new Date().toISOString(),
      };
    },
    {
      headers: t.Object({
        "x-service-key": t.Optional(t.String()),
      }),
    },
  )
  .post(
    "/reconcile",
    async ({ headers, body, set }) => {
      const serviceKey = headers["x-service-key"];
      if (!serviceKey || serviceKey !== WARDEN_SERVICE_KEY) {
        set.status = 401;
        return { error: "Invalid or missing service key" };
      }

      if (AUTHZ_ENABLED !== "true" || !AUTHZ_API_URL) {
        set.status = 400;
        return { error: "AuthZ is disabled or not configured" };
      }

      const deleteOrphans = body?.deleteOrphans ?? false;
      const dryRun = body?.dryRun ?? false;

      // Build expected tuples from DB
      const { orgWorkspaceTuples, workspaceProjectTuples } =
        await buildExpectedTuples();
      const expectedTuples = [...orgWorkspaceTuples, ...workspaceProjectTuples];

      // Fetch actual tuples from PDP
      const actualTuples = await fetchAllTuplesFromPDP();

      // Compute drift
      const { missing, orphaned } = computeDrift(expectedTuples, actualTuples);

      const results = {
        expected: expectedTuples.length,
        actual: actualTuples.length,
        missing: missing.length,
        orphaned: orphaned.length,
        written: 0,
        deleted: 0,
        dryRun,
        errors: [] as string[],
      };

      if (dryRun) {
        return {
          success: true,
          ...results,
          missingTuples: missing,
          orphanedTuples: orphaned,
          reconciledAt: new Date().toISOString(),
        };
      }

      // Write missing tuples (idempotent - Warden handles duplicates)
      if (missing.length > 0) {
        const writeResult = await writeTuples(missing);
        if (writeResult.success) {
          results.written = missing.length;
        } else {
          results.errors.push(`Write failed: ${writeResult.error}`);
        }
      }

      // Delete orphaned tuples if requested (idempotent)
      if (deleteOrphans && orphaned.length > 0) {
        const deleteResult = await deleteTuples(orphaned);
        if (deleteResult.success) {
          results.deleted = orphaned.length;
        } else {
          results.errors.push(`Delete failed: ${deleteResult.error}`);
        }
      }

      // Audit log
      // biome-ignore lint/suspicious/noConsole: reconciliation audit
      console.log(
        JSON.stringify({
          type: "authz_reconcile",
          ...results,
          timestamp: new Date().toISOString(),
        }),
      );

      return {
        success: results.errors.length === 0,
        ...results,
        reconciledAt: new Date().toISOString(),
      };
    },
    {
      headers: t.Object({
        "x-service-key": t.Optional(t.String()),
      }),
      body: t.Optional(
        t.Object({
          deleteOrphans: t.Optional(t.Boolean()),
          dryRun: t.Optional(t.Boolean()),
        }),
      ),
    },
  );

export default authzRoutes;
