/**
 * Structural authorization tuple reconciliation.
 *
 * Runa is the source of truth for the structural OpenFGA chain that backs
 * every project permission check:
 * - organization:{orgId} → organization → workspace:{orgId}
 * - workspace:{orgId} → workspace → project:{projectId}
 *
 * These tuples are written best-effort when projects are created. If one is
 * missed, `project:editor` can no longer resolve to org membership and the
 * whole board becomes inaccessible with no error surfaced anywhere. This
 * module rebuilds the expected set from the database and repairs any tuple
 * missing from the PDP, so structural drift self-heals.
 *
 * (User→organization membership tuples are a separate concern owned by the
 * IDP/Gatekeeper and reconciled there.)
 */

import { deleteTuples, isAuthzEnabled, writeTuples } from "lib/authz";
import { AUTHZ_API_URL, AUTHZ_SERVICE_KEY } from "lib/config/env.config";
import { dbPool } from "lib/db/db";
import { projects } from "lib/db/schema";

interface TupleKey {
  user: string;
  relation: string;
  object: string;
}

/** Request timeout for PDP calls */
const REQUEST_TIMEOUT_MS = 10_000;

/** Max tuples per page when reading from PDP (OpenFGA caps this at 100) */
const PDP_PAGE_SIZE = 100;

/** Max tuples per write/delete batch */
const BATCH_SIZE = 100;

/** How often the background reconciler runs */
const AUTHZ_RECONCILE_INTERVAL_MS = 60 * 60 * 1000;

/**
 * Build the expected structural tuples from Runa's database.
 *
 * Note: Runa uses orgId as workspaceId (no separate workspace entity).
 */
export async function buildExpectedTuples(): Promise<{
  orgWorkspaceTuples: TupleKey[];
  workspaceProjectTuples: TupleKey[];
}> {
  const allProjects = await dbPool
    .select({ id: projects.id, organizationId: projects.organizationId })
    .from(projects);

  const orgIds = [...new Set(allProjects.map((p) => p.organizationId))];

  const orgWorkspaceTuples: TupleKey[] = orgIds.map((orgId) => ({
    user: `organization:${orgId}`,
    relation: "organization",
    object: `workspace:${orgId}`,
  }));

  const workspaceProjectTuples: TupleKey[] = allProjects.map((p) => ({
    user: `workspace:${p.organizationId}`,
    relation: "workspace",
    object: `project:${p.id}`,
  }));

  return { orgWorkspaceTuples, workspaceProjectTuples };
}

/**
 * Fetch all structural tuples from the PDP with pagination.
 * Filters to Runa-managed object types (workspace, project).
 */
export async function fetchAllTuplesFromPDP(): Promise<TupleKey[]> {
  if (!AUTHZ_API_URL || !AUTHZ_SERVICE_KEY) {
    throw new Error("AUTHZ_API_URL and AUTHZ_SERVICE_KEY required");
  }

  const allTuples: TupleKey[] = [];
  let continuationToken: string | undefined;

  do {
    const params = new URLSearchParams({ pageSize: String(PDP_PAGE_SIZE) });
    if (continuationToken) {
      params.set("continuationToken", continuationToken);
    }

    const response = await fetch(
      `${AUTHZ_API_URL}/tuples?${params.toString()}`,
      {
        headers: { "X-Service-Key": AUTHZ_SERVICE_KEY },
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

    const runaTuples = data.tuples.filter(
      (t) =>
        (t.object.startsWith("workspace:") && t.relation === "organization") ||
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
export function computeDrift(
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

interface ReconcileResult {
  expected: number;
  actual: number;
  missing: number;
  orphaned: number;
  written: number;
  deleted: number;
  dryRun: boolean;
  errors: string[];
  missingTuples: TupleKey[];
  orphanedTuples: TupleKey[];
}

/**
 * Reconcile the structural tuples in the PDP against the database.
 *
 * Writes any missing tuples (batched). Orphan deletion is opt-in and off by
 * default: a scheduled run only ever adds, so it can restore access but never
 * revoke it. Always logs a one-line summary so a clean run is observable
 * (a silent "success" is exactly what let earlier drift go unnoticed).
 */
export async function reconcileStructuralTuples(opts?: {
  deleteOrphans?: boolean;
  dryRun?: boolean;
}): Promise<ReconcileResult> {
  const deleteOrphans = opts?.deleteOrphans ?? false;
  const dryRun = opts?.dryRun ?? false;

  const { orgWorkspaceTuples, workspaceProjectTuples } =
    await buildExpectedTuples();
  const expectedTuples = [...orgWorkspaceTuples, ...workspaceProjectTuples];

  const actualTuples = await fetchAllTuplesFromPDP();
  const { missing, orphaned } = computeDrift(expectedTuples, actualTuples);

  const errors: string[] = [];
  let written = 0;
  let deleted = 0;

  if (!dryRun) {
    for (let i = 0; i < missing.length; i += BATCH_SIZE) {
      const batch = missing.slice(i, i + BATCH_SIZE);
      const result = await writeTuples(batch);
      if (result.success) {
        written += batch.length;
      } else {
        errors.push(`Write failed: ${result.error}`);
      }
    }

    if (deleteOrphans) {
      for (let i = 0; i < orphaned.length; i += BATCH_SIZE) {
        const batch = orphaned.slice(i, i + BATCH_SIZE);
        const result = await deleteTuples(batch);
        if (result.success) {
          deleted += batch.length;
        } else {
          errors.push(`Delete failed: ${result.error}`);
        }
      }
    }
  }

  // biome-ignore lint/suspicious/noConsole: reconciliation audit
  console.log(
    JSON.stringify({
      type: "authz_structural_reconcile",
      expected: expectedTuples.length,
      actual: actualTuples.length,
      missing: missing.length,
      orphaned: orphaned.length,
      written,
      deleted,
      dryRun,
      errorCount: errors.length,
      timestamp: new Date().toISOString(),
    }),
  );

  return {
    expected: expectedTuples.length,
    actual: actualTuples.length,
    missing: missing.length,
    orphaned: orphaned.length,
    written,
    deleted,
    dryRun,
    errors,
    missingTuples: missing,
    orphanedTuples: orphaned,
  };
}

/**
 * Start the background structural reconciler: run once at boot to repair any
 * drift accumulated while down, then periodically. Add-only (never deletes).
 */
export function startStructuralReconciler(): void {
  if (!isAuthzEnabled()) return;

  reconcileStructuralTuples().catch((err) => {
    console.error("[AuthZ] Boot structural reconcile failed:", err);
  });

  setInterval(() => {
    reconcileStructuralTuples().catch((err) => {
      console.error("[AuthZ] Periodic structural reconcile failed:", err);
    });
  }, AUTHZ_RECONCILE_INTERVAL_MS).unref();
}
