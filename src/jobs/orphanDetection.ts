/**
 * Orphan Detection Job
 *
 * Detects settings records that reference organizations that no longer exist in the IDP.
 * Run this job periodically (e.g., daily via cron) to identify data inconsistencies.
 *
 * Usage:
 *   bun run src/jobs/orphanDetection.ts
 *
 * Environment:
 *   DATABASE_URL - Database connection string
 *   AUTH_BASE_URL - IDP base URL
 */

import { isNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";

import * as schema from "lib/db/schema";

const DATABASE_URL = process.env.DATABASE_URL;
const AUTH_BASE_URL = process.env.AUTH_BASE_URL;

if (!DATABASE_URL) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

if (!AUTH_BASE_URL) {
  console.error("AUTH_BASE_URL is required");
  process.exit(1);
}

const db = drizzle(DATABASE_URL, { schema });

/** Request timeout in milliseconds */
const REQUEST_TIMEOUT_MS = 5000;

/** Batch size for processing settings */
const BATCH_SIZE = 50;

interface OrphanedSettings {
  id: string;
  organizationId: string;
  createdAt: string;
}

/**
 * Check if an organization exists in the IDP.
 */
async function checkOrgExists(organizationId: string): Promise<boolean> {
  try {
    const response = await fetch(
      `${AUTH_BASE_URL}/api/organization/${organizationId}`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      },
    );

    return response.ok;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`Failed to check org ${organizationId}: ${message}`);
    // On error, assume org exists to avoid false positives
    return true;
  }
}

/**
 * Detect orphaned settings records.
 */
async function detectOrphanedSettings(): Promise<OrphanedSettings[]> {
  // biome-ignore lint/suspicious/noConsole: job logging
  console.log("Starting orphan detection job...");

  // Get all active (non-deleted) settings
  const allSettings = await db.query.settings.findMany({
    where: isNull(schema.settings.deletedAt),
    columns: {
      id: true,
      organizationId: true,
      createdAt: true,
    },
  });

  // biome-ignore lint/suspicious/noConsole: job logging
  console.log(`Found ${allSettings.length} active settings records to check`);

  const orphaned: OrphanedSettings[] = [];
  let checked = 0;

  // Process in batches to avoid overwhelming the IDP
  for (let i = 0; i < allSettings.length; i += BATCH_SIZE) {
    const batch = allSettings.slice(i, i + BATCH_SIZE);

    // Check each settings record in the batch concurrently
    const results = await Promise.all(
      batch.map(async (s) => {
        const exists = await checkOrgExists(s.organizationId);
        return { settings: s, exists };
      }),
    );

    for (const { settings: s, exists } of results) {
      if (!exists) {
        orphaned.push({
          id: s.id,
          organizationId: s.organizationId,
          createdAt: s.createdAt,
        });
      }
    }

    checked += batch.length;
    // biome-ignore lint/suspicious/noConsole: job logging
    console.log(`Checked ${checked}/${allSettings.length} settings records`);

    // Small delay between batches to be gentle on the IDP
    if (i + BATCH_SIZE < allSettings.length) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  return orphaned;
}

/**
 * Main entry point.
 */
async function main(): Promise<void> {
  try {
    const orphaned = await detectOrphanedSettings();

    if (orphaned.length === 0) {
      // biome-ignore lint/suspicious/noConsole: job logging
      console.log("No orphaned settings detected");
      return;
    }

    // biome-ignore lint/suspicious/noConsole: job logging
    console.log(`\nDetected ${orphaned.length} orphaned settings record(s):`);
    // biome-ignore lint/suspicious/noConsole: job logging
    console.log("-------------------------------------------");

    for (const s of orphaned) {
      // biome-ignore lint/suspicious/noConsole: job logging
      console.log(
        JSON.stringify({
          type: "orphaned_settings",
          settingsId: s.id,
          organizationId: s.organizationId,
          createdAt: s.createdAt,
          timestamp: new Date().toISOString(),
        }),
      );
    }

    // biome-ignore lint/suspicious/noConsole: job logging
    console.log("-------------------------------------------");
    // biome-ignore lint/suspicious/noConsole: job logging
    console.log(
      "\nAction required: Review these settings and consider soft-deleting them.",
    );
    // biome-ignore lint/suspicious/noConsole: job logging
    console.log(
      "To soft-delete, update the settings with deletedAt and deletionReason='orphaned'",
    );

    // Exit with non-zero code to indicate orphans were found (useful for alerting)
    process.exit(1);
  } catch (error) {
    console.error("Orphan detection job failed:", error);
    process.exit(2);
  }
}

main();
