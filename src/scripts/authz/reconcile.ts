/**
 * Reconcile Runa DB with AuthZ PDP (OpenFGA).
 *
 * - Writes missing tuples (in DB but not PDP)
 * - Optionally deletes orphaned tuples (--delete-orphans flag)
 *
 * Usage:
 *   bun authz:reconcile                   # Add missing only
 *   bun authz:reconcile --delete-orphans  # Add missing + delete orphaned
 *   bun authz:reconcile --dry-run         # Show what would be done
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
const REQUEST_TIMEOUT_MS = 10000;
const PDP_PAGE_SIZE = 200;

const deleteOrphans = process.argv.includes("--delete-orphans");
const dryRun = process.argv.includes("--dry-run");

interface TupleKey {
  user: string;
  relation: string;
  object: string;
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
  console.log(
    `Reconciling Runa DB with AuthZ PDP...${dryRun ? " (dry run)" : ""}\n`,
  );

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

  // Fetch actual tuples from PDP (with pagination)
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

  if (dryRun) {
    if (missingTuples.length > 0) {
      // biome-ignore lint/suspicious/noConsole: script output
      console.log("Would write missing tuples:");
      for (const t of missingTuples.slice(0, 10)) {
        // biome-ignore lint/suspicious/noConsole: script output
        console.log(`  ${t.user} → ${t.relation} → ${t.object}`);
      }
      if (missingTuples.length > 10) {
        // biome-ignore lint/suspicious/noConsole: script output
        console.log(`  ... and ${missingTuples.length - 10} more`);
      }
      // biome-ignore lint/suspicious/noConsole: script output
      console.log();
    }

    if (orphanedTuples.length > 0 && deleteOrphans) {
      // biome-ignore lint/suspicious/noConsole: script output
      console.log("Would delete orphaned tuples:");
      for (const t of orphanedTuples.slice(0, 10)) {
        // biome-ignore lint/suspicious/noConsole: script output
        console.log(`  ${t.user} → ${t.relation} → ${t.object}`);
      }
      if (orphanedTuples.length > 10) {
        // biome-ignore lint/suspicious/noConsole: script output
        console.log(`  ... and ${orphanedTuples.length - 10} more`);
      }
    }

    // biome-ignore lint/suspicious/noConsole: script output
    console.log("\nDry run complete - no changes made");
    return;
  }

  // Write missing tuples
  if (missingTuples.length > 0) {
    // biome-ignore lint/suspicious/noConsole: script output
    console.log(`Writing ${missingTuples.length} missing tuples...`);
    for (let i = 0; i < missingTuples.length; i += BATCH_SIZE) {
      const batch = missingTuples.slice(i, i + BATCH_SIZE);
      const result = await writeTuples(batch);
      if (!result.success) {
        console.error(`  Batch failed: ${result.error}`);
      } else {
        // biome-ignore lint/suspicious/noConsole: script output
        console.log(
          `  Batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(missingTuples.length / BATCH_SIZE)} ✓`,
        );
      }
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
        const result = await deleteTuples(batch);
        if (!result.success) {
          console.error(`  Batch failed: ${result.error}`);
        } else {
          // biome-ignore lint/suspicious/noConsole: script output
          console.log(
            `  Batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(orphanedTuples.length / BATCH_SIZE)} ✓`,
          );
        }
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
  console.log("✓ Reconciliation complete");
}

await reconcile()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
