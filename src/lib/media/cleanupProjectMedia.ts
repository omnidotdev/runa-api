/**
 * Best-effort deletion of object-storage media dereferenced by a project
 * update. Kept as a module-level function (not an inline plan dependency) so
 * the storage provider instance stays out of the exported executable schema.
 */

import { storage } from "lib/providers";
import { dereferencedProjectMediaKeys } from "./projectMediaKeys";

import type { ProjectMediaSnapshot } from "./projectMediaKeys";

/** Delete every object-storage key the update no longer references. Never throws. */
export const cleanupDereferencedMedia = async (
  old: ProjectMediaSnapshot | null | undefined,
  patch: Record<string, unknown> | null | undefined,
): Promise<void> => {
  for (const key of dereferencedProjectMediaKeys(old, patch)) {
    try {
      await storage.delete(key);
    } catch (error) {
      console.warn(`[Media] Failed to delete orphaned ${key}:`, error);
    }
  }
};
