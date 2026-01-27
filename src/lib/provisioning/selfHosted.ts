/**
 * Self-hosted provisioning utilities.
 *
 * Handles auto-provisioning of personal workspaces for self-hosted users.
 * Reuses the same provisioning logic as the IDP webhook handlers to ensure
 * consistency between SaaS and self-hosted deployments.
 *
 * @see lib/idp/webhooks.ts for the SaaS webhook handlers
 */

import { eq } from "drizzle-orm";

import { projectColumns, settings, userOrganizations } from "lib/db/schema";

import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import type * as schema from "lib/db/schema";

/** Default project columns provisioned for every new organization. */
const DEFAULT_PROJECT_COLUMNS = [
  { emoji: "🗓", title: "Planned", index: 0 },
  { emoji: "🚧", title: "In Progress", index: 1 },
  { emoji: "✅", title: "Completed", index: 2 },
] as const;

// Namespace UUID for generating deterministic UUIDs (same as runa-app)
const SELF_HOSTED_ORG_NAMESPACE = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";

/**
 * Generate a deterministic UUID v5 from a string.
 * Uses SHA-1 hash to create a reproducible UUID from namespace + name.
 * Matches the implementation in runa-app/src/lib/auth/rowIdCache.ts.
 */
async function generateUuidV5(name: string): Promise<string> {
  const encoder = new TextEncoder();

  // Parse namespace UUID to bytes
  const namespaceBytes = new Uint8Array(16);
  const hex = SELF_HOSTED_ORG_NAMESPACE.replace(/-/g, "");
  for (let i = 0; i < 16; i++) {
    namespaceBytes[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }

  // Concatenate namespace + name
  const nameBytes = encoder.encode(name);
  const data = new Uint8Array(namespaceBytes.length + nameBytes.length);
  data.set(namespaceBytes);
  data.set(nameBytes, namespaceBytes.length);

  // SHA-1 hash
  const hashBuffer = await crypto.subtle.digest("SHA-1", data);
  const hashArray = new Uint8Array(hashBuffer);

  // Set version (5) and variant bits
  hashArray[6] = (hashArray[6] & 0x0f) | 0x50;
  hashArray[8] = (hashArray[8] & 0x3f) | 0x80;

  // Format as UUID string
  const hexStr = Array.from(hashArray.slice(0, 16))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return `${hexStr.slice(0, 8)}-${hexStr.slice(8, 12)}-${hexStr.slice(12, 16)}-${hexStr.slice(16, 20)}-${hexStr.slice(20, 32)}`;
}

/**
 * Generate a URL-safe slug from a string.
 */
function generateSlug(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
}

interface ProvisionPersonalOrgParams {
  db: PostgresJsDatabase<typeof schema>;
  userId: string;
  identityProviderId: string;
  userName: string;
  userEmail: string;
}

/**
 * Provision a personal organization for a self-hosted user.
 *
 * This is called after user upsert in self-hosted mode to ensure
 * every user has at least one workspace. Uses deterministic IDs
 * so it's safe to call multiple times (idempotent).
 *
 * Provisions:
 * - User organization membership (owner role)
 * - Default project columns
 * - Default settings
 *
 * @returns true if a new org was created, false if user already had orgs
 */
export async function provisionPersonalOrganization({
  db,
  userId,
  identityProviderId,
  userName,
  userEmail,
}: ProvisionPersonalOrgParams): Promise<boolean> {
  try {
    // Check if user already has any organizations
    const existingOrgs = await db
      .select({ id: userOrganizations.id })
      .from(userOrganizations)
      .where(eq(userOrganizations.userId, userId))
      .limit(1);

    if (existingOrgs.length > 0) {
      // User already has org(s), nothing to do
      return false;
    }

    // Generate deterministic org ID from identityProviderId
    // This ensures the same user always gets the same org ID
    const organizationId = await generateUuidV5(`org:${identityProviderId}`);

    // Generate slug from email or name
    const slug = generateSlug(userEmail.split("@")[0] || userName);

    // Create user organization membership
    await db
      .insert(userOrganizations)
      .values({
        userId,
        organizationId,
        slug,
        name: `${userName}'s Workspace`,
        type: "personal",
        role: "owner",
        syncedAt: new Date().toISOString(),
      })
      .onConflictDoNothing();

    // Provision default project columns (same as webhook handler)
    const existingColumns = await db
      .select({ id: projectColumns.id })
      .from(projectColumns)
      .where(eq(projectColumns.organizationId, organizationId))
      .limit(1);

    if (existingColumns.length === 0) {
      await db.insert(projectColumns).values(
        DEFAULT_PROJECT_COLUMNS.map((col) => ({
          organizationId,
          emoji: col.emoji,
          title: col.title,
          index: col.index,
        })),
      );
    }

    // Provision default settings (same as webhook handler)
    const existingSettings = await db
      .select({ id: settings.id })
      .from(settings)
      .where(eq(settings.organizationId, organizationId))
      .limit(1);

    if (existingSettings.length === 0) {
      await db.insert(settings).values({
        organizationId,
        viewMode: "board",
      });
    }

    // biome-ignore lint/suspicious/noConsole: provisioning logging
    console.log(
      `[Self-hosted] Provisioned personal workspace for user ${userId} (org: ${organizationId})`,
    );

    return true;
  } catch (err) {
    console.error("[Self-hosted] Failed to provision personal workspace:", err);
    // Don't throw - provisioning failure shouldn't block authentication
    return false;
  }
}
