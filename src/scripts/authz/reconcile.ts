/**
 * Reconcile Runa DB with AuthZ PDP (OpenFGA).
 *
 * - Writes missing tuples (in DB but not PDP)
 * - Optionally deletes orphaned tuples (--delete-orphans flag)
 *
 * Usage:
 *   bun authz:reconcile              # Add missing only
 *   bun authz:reconcile --delete-orphans  # Add missing + delete orphaned
 */

import { drizzle } from "drizzle-orm/node-postgres";

import { deleteTuples, writeTuples } from "lib/authz";
import {
  AUTHZ_API_URL,
  AUTHZ_ENABLED,
  WARDEN_SERVICE_KEY,
} from "lib/config/env.config";
import * as schema from "lib/db/schema";

const DATABASE_URL = process.env.DATABASE_URL;
const BATCH_SIZE = 100;
const deleteOrphans = process.argv.includes("--delete-orphans");

interface Tuple {
  user: string;
  relation: string;
  object: string;
}

async function fetchTuplesFromPDP(objectType: string): Promise<Tuple[]> {
  if (!AUTHZ_API_URL || !WARDEN_SERVICE_KEY) {
    throw new Error("AUTHZ_API_URL and WARDEN_SERVICE_KEY required");
  }

  const response = await fetch(
    `${AUTHZ_API_URL}/tuples?object_type=${objectType}`,
    {
      headers: { "X-Service-Key": WARDEN_SERVICE_KEY },
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch tuples: ${response.status}`);
  }

  const data = (await response.json()) as { tuples: Tuple[] };
  return data.tuples;
}

async function reconcile() {
  if (!DATABASE_URL) {
    console.error("`DATABASE_URL` is not defined");
    process.exit(1);
  }

  if (AUTHZ_ENABLED !== "true" || !AUTHZ_API_URL) {
    console.error("AuthZ is disabled or AUTHZ_API_URL not set");
    process.exit(1);
  }

  // biome-ignore lint/suspicious/noConsole: script output
  console.log("Reconciling Runa DB with AuthZ PDP...\n");

  const db = drizzle(DATABASE_URL, { schema, casing: "snake_case" });

  // Get all projects from DB
  const projects = await db
    .select({
      id: schema.projects.id,
      organizationId: schema.projects.organizationId,
    })
    .from(schema.projects);

  // Build expected tuples
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

  // biome-ignore lint/suspicious/noConsole: script output
  console.log(
    `Found ${projects.length} projects across ${orgIds.length} organizations`,
  );
  // biome-ignore lint/suspicious/noConsole: script output
  console.log(
    `Expected ${expectedTuples.length} tuples, found ${actualTuples.length} in PDP`,
  );
  // biome-ignore lint/suspicious/noConsole: script output
  console.log(
    `Missing: ${missingTuples.length}, Orphaned: ${orphanedTuples.length}\n`,
  );

  // Write missing tuples
  if (missingTuples.length > 0) {
    // biome-ignore lint/suspicious/noConsole: script output
    console.log(`Writing ${missingTuples.length} missing tuples...`);
    for (let i = 0; i < missingTuples.length; i += BATCH_SIZE) {
      const batch = missingTuples.slice(i, i + BATCH_SIZE);
      await writeTuples(batch);
      // biome-ignore lint/suspicious/noConsole: script output
      console.log(
        `  Batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(missingTuples.length / BATCH_SIZE)}`,
      );
    }
    // biome-ignore lint/suspicious/noConsole: script output
    console.log("Missing tuples written\n");
  }

  // Delete orphaned tuples (if flag set)
  if (orphanedTuples.length > 0) {
    if (deleteOrphans) {
      // biome-ignore lint/suspicious/noConsole: script output
      console.log(`Deleting ${orphanedTuples.length} orphaned tuples...`);
      for (let i = 0; i < orphanedTuples.length; i += BATCH_SIZE) {
        const batch = orphanedTuples.slice(i, i + BATCH_SIZE);
        await deleteTuples(batch);
        // biome-ignore lint/suspicious/noConsole: script output
        console.log(
          `  Batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(orphanedTuples.length / BATCH_SIZE)}`,
        );
      }
      // biome-ignore lint/suspicious/noConsole: script output
      console.log("Orphaned tuples deleted\n");
    } else {
      // biome-ignore lint/suspicious/noConsole: script output
      console.log(
        `${orphanedTuples.length} orphaned tuples found. Use --delete-orphans to remove.\n`,
      );
    }
  }

  // biome-ignore lint/suspicious/noConsole: script output
  console.log("Reconciliation complete");
}

await reconcile()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
