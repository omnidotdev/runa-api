/**
 * Detect drift between Runa DB and AuthZ PDP (OpenFGA).
 *
 * Compares:
 * - Projects in DB vs workspace->project tuples in PDP
 * - Organizations with projects vs org->workspace tuples in PDP
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

interface Tuple {
  user: string;
  relation: string;
  object: string;
}

interface DriftReport {
  missingTuples: Tuple[];
  orphanedTuples: Tuple[];
  checkedAt: string;
}

async function fetchTuplesFromPDP(objectType: string): Promise<Tuple[]> {
  if (!AUTHZ_API_URL || !WARDEN_SERVICE_KEY) {
    throw new Error("AUTHZ_API_URL and WARDEN_SERVICE_KEY required");
  }

  const response = await fetch(
    `${AUTHZ_API_URL}/tuples?object_type=${objectType}`,
    {
      headers: {
        "X-Service-Key": WARDEN_SERVICE_KEY,
      },
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch tuples: ${response.status}`);
  }

  const data = (await response.json()) as { tuples: Tuple[] };
  return data.tuples;
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

  const expectedOrgWorkspace = orgIds.map((orgId) => ({
    user: `organization:${orgId}`,
    relation: "organization",
    object: `workspace:${orgId}`,
  }));

  const expectedWorkspaceProject = projects.map((project) => ({
    user: `workspace:${project.organizationId}`,
    relation: "workspace",
    object: `project:${project.id}`,
  }));

  const expectedTuples = [...expectedOrgWorkspace, ...expectedWorkspaceProject];

  // Fetch actual tuples from PDP
  const workspaceTuples = await fetchTuplesFromPDP("workspace");
  const projectTuples = await fetchTuplesFromPDP("project");
  const actualTuples = [...workspaceTuples, ...projectTuples];

  // Compare
  const tupleKey = (t: Tuple) => `${t.user}|${t.relation}|${t.object}`;
  const expectedKeys = new Set(expectedTuples.map(tupleKey));
  const actualKeys = new Set(actualTuples.map(tupleKey));

  const missingTuples = expectedTuples.filter(
    (t) => !actualKeys.has(tupleKey(t)),
  );
  const orphanedTuples = actualTuples.filter(
    (t) => !expectedKeys.has(tupleKey(t)),
  );

  return {
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
    `\nFound ${report.missingTuples.length} missing tuples (in DB but not PDP)`,
  );
}

if (report.orphanedTuples.length > 0) {
  console.error(
    `\nFound ${report.orphanedTuples.length} orphaned tuples (in PDP but not DB)`,
  );
}

if (report.missingTuples.length === 0 && report.orphanedTuples.length === 0) {
  // biome-ignore lint/suspicious/noConsole: script output
  console.log("\nNo drift detected");
  process.exit(0);
} else {
  // biome-ignore lint/suspicious/noConsole: script output
  console.log("\nDrift detected - run `bun authz:reconcile` to fix");
  process.exit(1);
}
