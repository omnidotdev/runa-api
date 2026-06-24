/**
 * Best-effort deletion of object-storage media dereferenced by a project
 * update. Kept as a module-level function (not an inline plan dependency) so
 * the storage provider instance stays out of the exported executable schema.
 */

import { storage } from "lib/providers";
import {
  allProjectMediaKeys,
  dereferencedProjectMediaKeys,
} from "./projectMediaKeys";

import type { ProjectMediaSnapshot } from "./projectMediaKeys";

/** Best-effort delete of every given storage key. Never throws. */
const deleteKeys = async (keys: string[]): Promise<void> => {
  for (const key of keys) {
    try {
      await storage.delete(key);
    } catch (error) {
      console.warn(`[Media] Failed to delete orphaned ${key}:`, error);
    }
  }
};

/** Delete every object-storage key the update no longer references. */
export const cleanupDereferencedMedia = (
  old: ProjectMediaSnapshot | null | undefined,
  patch: Record<string, unknown> | null | undefined,
): Promise<void> => deleteKeys(dereferencedProjectMediaKeys(old, patch));

/** Delete every object-storage key a (now-deleted) project referenced. */
export const cleanupAllProjectMedia = (
  old: ProjectMediaSnapshot | null | undefined,
): Promise<void> => deleteKeys(allProjectMediaKeys(old));
