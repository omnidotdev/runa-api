/**
 * Organization provisioning.
 *
 * Ensures an organization has the baseline resources Runa needs to be usable:
 * the default project columns and a settings row. This is idempotent and safe
 * to call from any access path (the IDP webhook, or lazily during request auth).
 *
 * Lazy provisioning exists because organization creation events are delivered
 * out-of-band (Gatekeeper -> Vortex) and may never reach this service. Rather
 * than depend on event delivery, we self-heal on first access so any org a user
 * can reach is always provisioned.
 */

import { generateNKeysBetween } from "fractional-indexing";

import { dbPool } from "lib/db/db";
import { projectColumns, settings } from "lib/db/schema";

/** Default project columns provisioned for every organization. */
const DEFAULT_PROJECT_COLUMNS = [
  { icon: "🗓", title: "Planned" },
  { icon: "🚧", title: "In Progress" },
  { icon: "✅", title: "Completed" },
] as const;

/**
 * Organizations already provisioned in this process lifetime. Keeps the lazy
 * path on hot requests effectively free after the first hit. Only populated on
 * a fully successful pass so failures are retried.
 */
const provisionedOrgs = new Set<string>();

/**
 * Ensure an organization has its default project columns and settings row.
 *
 * Idempotent (relies on unique constraints + `onConflictDoNothing`) and
 * non-fatal: a failure is logged and the org is left uncached so the next
 * access retries. Never throws.
 */
export async function ensureOrganizationProvisioned(
  organizationId: string,
): Promise<void> {
  if (provisionedOrgs.has(organizationId)) return;

  try {
    const indices = generateNKeysBetween(
      null,
      null,
      DEFAULT_PROJECT_COLUMNS.length,
    );

    await dbPool
      .insert(projectColumns)
      .values(
        DEFAULT_PROJECT_COLUMNS.map((col, i) => ({
          organizationId,
          icon: col.icon,
          title: col.title,
          index: indices[i]!,
        })),
      )
      .onConflictDoNothing();

    await dbPool
      .insert(settings)
      .values({ organizationId })
      .onConflictDoNothing();
  } catch (err) {
    console.error(`Failed to provision organization ${organizationId}:`, err);
    return;
  }

  provisionedOrgs.add(organizationId);
}
