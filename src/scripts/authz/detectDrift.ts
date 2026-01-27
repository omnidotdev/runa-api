/**
 * Detect drift between Runa DB and AuthZ PDP (OpenFGA).
 *
 * Compares:
 * - Organizations with projects vs org→workspace tuples
 * - Projects in DB vs workspace→project tuples
 *
 * Reports:
 * - Missing tuples (in DB but not PDP)
 * - Orphaned tuples (in PDP but not DB)
 *
 * Usage: bun authz:detect-drift
 */

import { drizzle } from "drizzle-orm/node-postgres";

import {
  AUTHZ_API_URL,
  AUTHZ_ENABLED,
  WARDEN_SERVICE_KEY,
} from "lib/config/env.config";
import * as schema from "lib/db/schema";

const DATABASE_URL = process.env.DATABASE_URL;

/** Request timeout for PDP calls */
const REQUEST_TIMEOUT_MS = 10000;

/** Max tuples per page when reading from PDP */
const PDP_PAGE_SIZE = 200;

interface TupleKey {
  user: string;
  relation: string;
  object: string;
}

interface DriftReport {
  expected: number;
  actual: number;
  missingTuples: TupleKey[];
  orphanedTuples: TupleKey[];
  checkedAt: string;
}

/**
 * Fetch all Runa-managed tuples from PDP with pagination.
 */
async function fetchAllTuplesFromPDP(): Promise<TupleKey[]> {
  if (!AUTHZ_API_URL || !WARDEN_SERVICE_KEY) {
    throw new Error("AUTHZ_API_URL and WARDEN_SERVICE_KEY required");
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

async function detectDrift(): Promise<DriftReport> {
  if (!DATABASE_URL) {
    console.error("`DATABASE_URL` is not defined");
    process.exit(1);
  }

  if (AUTHZ_ENABLED !== "true" || !AUTHZ_API_URL) {
    console.error("AuthZ is disabled or AUTHZ_API_URL not set");
    process.exit(1);
  }

  const db = drizzle(DATABASE_URL, { schema, casing: "snake_case" });

  // Get all projects from DB
  const projects = await db
    .select({
      id: schema.projects.id,
      organizationId: schema.projects.organizationId,
    })
    .from(schema.projects);

  // Build expected tuples from DB
  const orgIds = [...new Set(projects.map((p) => p.organizationId))];

  // organization:{orgId} → organization → workspace:{orgId}
  const expectedOrgWorkspace = orgIds.map((orgId) => ({
    user: `organization:${orgId}`,
    relation: "organization",
    object: `workspace:${orgId}`,
  }));

  // workspace:{orgId} → workspace → project:{projectId}
  const expectedWorkspaceProject = projects.map((project) => ({
    user: `workspace:${project.organizationId}`,
    relation: "workspace",
    object: `project:${project.id}`,
  }));

  const expectedTuples = [...expectedOrgWorkspace, ...expectedWorkspaceProject];

  // Fetch actual tuples from PDP
  const actualTuples = await fetchAllTuplesFromPDP();

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

  return {
    expected: expectedTuples.length,
    actual: actualTuples.length,
    missingTuples,
    orphanedTuples,
    checkedAt: new Date().toISOString(),
  };
}

// Main
const report = await detectDrift();

// biome-ignore lint/suspicious/noConsole: script output
console.log(JSON.stringify(report, null, 2));

if (report.missingTuples.length > 0) {
  console.error(
    `\n⚠️  Found ${report.missingTuples.length} missing tuples (in DB but not PDP)`,
  );
}

if (report.orphanedTuples.length > 0) {
  console.error(
    `\n⚠️  Found ${report.orphanedTuples.length} orphaned tuples (in PDP but not DB)`,
  );
}

if (
  report.missingTuples.length === 0 &&
  report.orphanedTuples.length === 0
) {
  // biome-ignore lint/suspicious/noConsole: script output
  console.log("\n✓ No drift detected");
  process.exit(0);
} else {
  // biome-ignore lint/suspicious/noConsole: script output
  console.log("\n→ Run `bun authz:reconcile` to fix drift");
  process.exit(1);
}
