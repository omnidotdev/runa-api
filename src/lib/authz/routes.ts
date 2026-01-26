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

/**
 * Export all authorization tuples from Runa's source of truth.
 * Used by warden-api to rebuild OpenFGA tuples.
 *
 * Note: Member tuples (user→organization relationships) are NOT exported here.
 * Those are managed by IDP (Gatekeeper), which is the source of truth for
 * organization membership. This endpoint only exports Runa-specific resource
 * relationships (organization→project).
 *
 * Authorization model:
 * - organization:X has 'organization' relation on project:Y
 * - No intermediate workspace - projects belong directly to organizations
 */
async function exportAllTuples(): Promise<TupleKey[]> {
  const tuples: TupleKey[] = [];

  // Project-organization relationships (project table)
  // organization:X has 'organization' relation on project:Y
  const allProjects = await dbPool
    .select({ id: projects.id, organizationId: projects.organizationId })
    .from(projects);
  for (const p of allProjects) {
    tuples.push({
      user: `organization:${p.organizationId}`,
      relation: "organization",
      object: `project:${p.id}`,
    });
  }

  return tuples;
}

/**
 * Fetch tuples from PDP for a given object type.
 */
async function fetchTuplesFromPDP(objectType: string): Promise<TupleKey[]> {
  if (!AUTHZ_API_URL || !WARDEN_SERVICE_KEY) {
    throw new Error("AUTHZ_API_URL and WARDEN_SERVICE_KEY required");
  }

  const response = await fetch(
    `${AUTHZ_API_URL}/tuples?object_type=${objectType}`,
    {
      headers: { "X-Service-Key": WARDEN_SERVICE_KEY },
      signal: AbortSignal.timeout(10000),
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch tuples: ${response.status}`);
  }

  const data = (await response.json()) as { tuples: TupleKey[] };
  return data.tuples;
}

/**
 * Authorization routes for tuple export and reconciliation.
 * Called by warden-api during tuple rebuilds.
 */
const authzRoutes = new Elysia({ prefix: "/authz" })
  .get("/tuples", async () => {
    const tuples = await exportAllTuples();

    return {
      tuples,
      count: tuples.length,
      exportedAt: new Date().toISOString(),
    };
  })
  .post(
    "/reconcile",
    async ({ headers, body, set }) => {
      // Verify service key
      const serviceKey = headers["x-service-key"];
      if (!serviceKey || serviceKey !== WARDEN_SERVICE_KEY) {
        set.status = 401;
        return { error: "Invalid or missing service key" };
      }

      // Check authz is enabled
      if (AUTHZ_ENABLED !== "true" || !AUTHZ_API_URL) {
        set.status = 400;
        return { error: "AuthZ is disabled or not configured" };
      }

      const deleteOrphans = body?.deleteOrphans ?? false;

      // Get expected tuples from Runa DB
      const expectedTuples = await exportAllTuples();

      // Fetch actual tuples from PDP
      const actualTuples = await fetchTuplesFromPDP("project");

      // Compare
      const tupleKey = (t: TupleKey) => `${t.user}|${t.relation}|${t.object}`;
      const expectedKeys = new Set(expectedTuples.map(tupleKey));
      const actualKeys = new Set(actualTuples.map(tupleKey));

      const missingTuples = expectedTuples.filter(
        (t) => !actualKeys.has(tupleKey(t)),
      );
      const orphanedTuples = actualTuples.filter(
        (t) => !expectedKeys.has(tupleKey(t)),
      );

      const results = {
        expected: expectedTuples.length,
        actual: actualTuples.length,
        missing: missingTuples.length,
        orphaned: orphanedTuples.length,
        written: 0,
        deleted: 0,
        errors: [] as string[],
      };

      // Write missing tuples
      if (missingTuples.length > 0) {
        const writeResult = await writeTuples(missingTuples);
        if (writeResult.success) {
          results.written = missingTuples.length;
        } else {
          results.errors.push(`Write failed: ${writeResult.error}`);
        }
      }

      // Delete orphaned tuples if requested
      if (deleteOrphans && orphanedTuples.length > 0) {
        const deleteResult = await deleteTuples(orphanedTuples);
        if (deleteResult.success) {
          results.deleted = orphanedTuples.length;
        } else {
          results.errors.push(`Delete failed: ${deleteResult.error}`);
        }
      }

      // biome-ignore lint/suspicious/noConsole: reconciliation audit log
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
        }),
      ),
    },
  );

export default authzRoutes;
