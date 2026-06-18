/**
 * Reconcile (self-heal) Meilisearch indexes from the database.
 *
 * Re-indexes every project, task, and comment. Idempotent: documents are upserted
 * by id, so running repeatedly converges search to the database without duplicates.
 * Use after a manual/bulk write that bypassed the GraphQL mutation path, or to
 * recover documents dropped by a transient Meilisearch outage.
 *
 * Usage:
 *   bun search:reconcile
 */

import { isSearchEnabled, reconcileSearchIndex } from "lib/search";

if (!isSearchEnabled) {
  console.error(
    "Search is disabled (MEILISEARCH_URL/MEILISEARCH_MASTER_KEY not set), nothing to reconcile",
  );
  process.exit(1);
}

await reconcileSearchIndex();
process.exit(0);
