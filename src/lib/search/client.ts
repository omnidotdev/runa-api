import { OmniSearch, indexes } from "@omnidotdev/search";

import {
  MEILISEARCH_MASTER_KEY,
  MEILISEARCH_URL,
  isSearchEnabled,
} from "lib/config/env.config";

/**
 * Meilisearch client for Runa.
 * Only initialized if SEARCH_ENABLED is true and credentials are present.
 */
export const search = isSearchEnabled
  ? new OmniSearch({
      host: MEILISEARCH_URL!,
      masterKey: MEILISEARCH_MASTER_KEY!,
    })
  : null;

/**
 * Runa index configurations.
 */
export const runaIndexes = indexes.runa;

/**
 * Initialize Runa search indexes.
 * Should be called during application bootstrap.
 */
export async function initializeSearchIndexes(): Promise<void> {
  if (!search) {
    return;
  }

  try {
    await search.configureIndex(runaIndexes.projects);
    await search.configureIndex(runaIndexes.tasks);
    await search.configureIndex(runaIndexes.comments);
  } catch (error) {
    console.error("[Search] Failed to initialize indexes:", error);
    // Don't throw - search is non-critical
  }
}
