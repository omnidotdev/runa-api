/**
 * Backfill organization-project tuples into Warden.
 *
 * Creates tuples: organization:{orgId} → organization → project:{projectId}
 *
 * This is needed because projects created before authz sync was implemented
 * (Jan 22, 2026) don't have their organization relationships in OpenFGA.
 */

import { drizzle } from "drizzle-orm/node-postgres";

import { writeTuples, isAuthzEnabled } from "lib/authz";
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
    console.log("No projects found to backfill");
    return;
  }

  // Build tuples for organization → project relationships
  const tuples = projects.map((project) => ({
    user: `organization:${project.organizationId}`,
    relation: "organization",
    object: `project:${project.id}`,
  }));

  console.log(`Found ${projects.length} projects to backfill`);

  // Write tuples in batches
  for (let i = 0; i < tuples.length; i += BATCH_SIZE) {
    const batch = tuples.slice(i, i + BATCH_SIZE);
    try {
      await writeTuples(batch);
      console.log(
        `Wrote batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(tuples.length / BATCH_SIZE)} (${batch.length} tuples)`,
      );
    } catch (error) {
      console.error(
        `Failed to write batch ${Math.floor(i / BATCH_SIZE) + 1}:`,
        error,
      );
      // Continue with next batch - writeTuples is idempotent
    }
  }

  console.log(
    `Backfilled ${tuples.length} organization-project tuples from ${projects.length} projects`,
  );
};

await backfillProjectTuples()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
