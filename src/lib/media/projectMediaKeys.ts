/**
 * Pure helpers for project media cleanup: given a project's prior media and an
 * update patch, determine which object-storage keys are no longer referenced.
 *
 * `project.image` stores a proxied serve URL (recover the key via
 * `storageKeyFromUrl`); `project.background` stores the storage key directly in
 * `assetId` for image-kind backgrounds.
 */

import { storageKeyFromUrl } from "./util";

import type { ProjectBackground } from "lib/db/schema/project.table";

/** The subset of a project row this cleanup cares about. */
export interface ProjectMediaSnapshot {
  image?: string | null;
  background?: unknown;
}

/** Storage key referenced by a background value, or null when it isn't an image. */
const backgroundAssetId = (background: unknown): string | null => {
  const value = background as ProjectBackground | null | undefined;
  return value?.kind === "image" ? value.assetId : null;
};

/**
 * Storage keys dereferenced by applying `patch` to `old`. A field is only
 * considered when the patch actually contains it (an omitted field leaves the
 * value unchanged), so this returns the old keys that the update replaces,
 * removes, or switches away from, never a still-referenced one.
 */
export const dereferencedProjectMediaKeys = (
  old: ProjectMediaSnapshot | null | undefined,
  patch: Record<string, unknown> | null | undefined,
): string[] => {
  if (!old || !patch) return [];

  const keys: string[] = [];

  if ("image" in patch) {
    const oldKey = old.image ? storageKeyFromUrl(old.image) : null;
    const newKey =
      typeof patch.image === "string" ? storageKeyFromUrl(patch.image) : null;
    if (oldKey && oldKey !== newKey) keys.push(oldKey);
  }

  if ("background" in patch) {
    const oldKey = backgroundAssetId(old.background);
    const newKey = backgroundAssetId(patch.background);
    if (oldKey && oldKey !== newKey) keys.push(oldKey);
  }

  return keys;
};

/**
 * Every storage key a project references (image + image background). Used when
 * the whole project is deleted, where all of its media is dereferenced at once.
 */
export const allProjectMediaKeys = (
  old: ProjectMediaSnapshot | null | undefined,
): string[] => {
  if (!old) return [];

  const keys: string[] = [];

  const imageKey = old.image ? storageKeyFromUrl(old.image) : null;
  if (imageKey) keys.push(imageKey);

  const backgroundKey = backgroundAssetId(old.background);
  if (backgroundKey) keys.push(backgroundKey);

  return keys;
};
