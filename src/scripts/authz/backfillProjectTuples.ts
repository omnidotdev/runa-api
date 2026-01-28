/**
 * Backfill workspace-project tuples into Warden.
 *
 * Creates tuples:
 * - organization:{orgId} → organization → workspace:{orgId}
 * - workspace:{orgId} → workspace → project:{projectId}
 *
 * Note: Runa has no workspace concept, so we use orgId as workspaceId.
 * This matches the deployed OpenFGA model which uses workspace for projects.
 *
 * This is needed because projects created before authz sync was implemented
 * (Jan 22, 2026) don't have their relationships in OpenFGA.
 */

import { drizzle } from "drizzle-orm/node-postgres";

import { isAuthzEnabled, writeTuples } from "lib/authz";
import * as schema from "lib/db/schema";

const DATABASE_URL = process.env.DATABASE_URL;
const BATCH_SIZE = 100;

const backfillProjectTuples = async () => {
  if (!DATABASE_URL) {
    console.error("`DATABASE_URL` is not defined");
    process.exit(1);
  }

  if (!isAuthzEnabled()) {
    console.error(
      "Authz sync is disabled or missing AUTHZ_API_URL. Set AUTHZ_ENABLED=true and AUTHZ_API_URL.",
    );
    process.exit(1);
  }

  const db = drizzle(DATABASE_URL, { schema, casing: "snake_case" });

  // Get all projects with their organization IDs
  const projects = await db
    .select({
      id: schema.projects.id,
      organizationId: schema.projects.organizationId,
      name: schema.projects.name,
    })
    .from(schema.projects);

  if (projects.length === 0) {
    // biome-ignore lint/suspicious/noConsole: script logging
    console.log("No projects found to backfill");
    return;
  }

  // Collect unique org IDs
  const orgIds = [...new Set(projects.map((p) => p.organizationId))];

  // Build org → workspace tuples (one per org)
  const orgWorkspaceTuples = orgIds.map((orgId) => ({
    user: `organization:${orgId}`,
    relation: "organization",
    object: `workspace:${orgId}`,
  }));

  // Build workspace → project tuples
  const workspaceProjectTuples = projects.map((project) => ({
    user: `workspace:${project.organizationId}`,
    relation: "workspace",
    object: `project:${project.id}`,
  }));

  // biome-ignore lint/suspicious/noConsole: script logging
  console.log(
    `Found ${projects.length} projects across ${orgIds.length} organizations`,
  );

  // Write org → workspace tuples first
  // biome-ignore lint/suspicious/noConsole: script logging
  console.log(`Writing ${orgWorkspaceTuples.length} org→workspace tuples...`);
  for (let i = 0; i < orgWorkspaceTuples.length; i += BATCH_SIZE) {
    const batch = orgWorkspaceTuples.slice(i, i + BATCH_SIZE);
    try {
      await writeTuples(batch);
      // biome-ignore lint/suspicious/noConsole: script logging
      console.log(
        `  Batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(orgWorkspaceTuples.length / BATCH_SIZE)} (${batch.length} tuples)`,
      );
    } catch (error) {
      console.error(`  Failed batch ${Math.floor(i / BATCH_SIZE) + 1}:`, error);
    }
  }

  // Write workspace → project tuples
  // biome-ignore lint/suspicious/noConsole: script logging
  console.log(
    `Writing ${workspaceProjectTuples.length} workspace→project tuples...`,
  );
  for (let i = 0; i < workspaceProjectTuples.length; i += BATCH_SIZE) {
    const batch = workspaceProjectTuples.slice(i, i + BATCH_SIZE);
    try {
      await writeTuples(batch);
      // biome-ignore lint/suspicious/noConsole: script logging
      console.log(
        `  Batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(workspaceProjectTuples.length / BATCH_SIZE)} (${batch.length} tuples)`,
      );
    } catch (error) {
      console.error(`  Failed batch ${Math.floor(i / BATCH_SIZE) + 1}:`, error);
    }
  }

  // biome-ignore lint/suspicious/noConsole: script logging
  console.log(
    `Backfilled ${orgWorkspaceTuples.length + workspaceProjectTuples.length} tuples from ${projects.length} projects`,
  );
};

await backfillProjectTuples()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
