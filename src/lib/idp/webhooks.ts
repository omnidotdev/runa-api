/**
 * IDP (Identity Provider) webhook handler.
 *
 * Receives organization lifecycle events from the IDP.
 * Handles soft-deletion of settings when organizations are deleted.
 */

import { createHmac, timingSafeEqual } from "node:crypto";

import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { invalidatePermissionCache } from "lib/authz";
import { IDP_WEBHOOK_SECRET } from "lib/config/env.config";
import { dbPool } from "lib/db/db";
import { projectColumns, settings, users } from "lib/db/schema";

interface OrganizationCreatedPayload {
  eventType: "organization.created";
  organizationId: string;
  organizationType: "personal" | "team";
  timestamp: string;
}

interface OrganizationDeletedPayload {
  eventType: "organization.deleted";
  organizationId: string;
  deletedAt: string;
  timestamp: string;
}

interface MemberAddedPayload {
  eventType: "member.added";
  organizationId: string;
  userId: string;
  role: "owner" | "admin" | "member";
  timestamp: string;
}

interface MemberRemovedPayload {
  eventType: "member.removed";
  organizationId: string;
  userId: string;
  timestamp: string;
}

interface MemberRoleChangedPayload {
  eventType: "member.role_changed";
  organizationId: string;
  userId: string;
  oldRole: "owner" | "admin" | "member";
  newRole: "owner" | "admin" | "member";
  timestamp: string;
}

interface UserDeletedPayload {
  eventType: "user.deleted";
  userId: string;
  deletedAt: string;
  timestamp: string;
}

type IdpWebhookPayload =
  | OrganizationCreatedPayload
  | OrganizationDeletedPayload
  | MemberAddedPayload
  | MemberRemovedPayload
  | MemberRoleChangedPayload
  | UserDeletedPayload;

/**
 * Verify HMAC-SHA256 signature from IDP.
 */
const verifySignature = (
  payload: string,
  signature: string,
  secret: string,
): boolean => {
  try {
    const expectedSignature = createHmac("sha256", secret)
      .update(payload)
      .digest("hex");

    const signatureBuffer = Buffer.from(signature, "hex");
    const expectedBuffer = Buffer.from(expectedSignature, "hex");

    if (signatureBuffer.length !== expectedBuffer.length) {
      return false;
    }

    return timingSafeEqual(signatureBuffer, expectedBuffer);
  } catch {
    return false;
  }
};

/**
 * IDP webhook receiver.
 * Receives organization lifecycle events from the identity provider.
 */
const idpWebhook = new Elysia({ prefix: "/webhooks" }).post(
  "/idp",
  async ({ request, headers, set }) => {
    const signature = headers["x-idp-signature"];
    const eventType = headers["x-idp-event"];

    if (!IDP_WEBHOOK_SECRET) {
      console.warn(
        "IDP_WEBHOOK_SECRET not set - skipping signature verification",
      );
    }

    try {
      const rawBody = await request.text();

      // Verify signature if secret is configured
      if (IDP_WEBHOOK_SECRET && signature) {
        const isValid = verifySignature(rawBody, signature, IDP_WEBHOOK_SECRET);

        if (!isValid) {
          set.status = 401;
          return { error: "Invalid signature" };
        }
      } else if (IDP_WEBHOOK_SECRET && !signature) {
        set.status = 401;
        return { error: "Missing signature" };
      }

      const body = JSON.parse(rawBody) as IdpWebhookPayload;

      // biome-ignore lint/suspicious/noConsole: webhook logging
      console.log(
        `IDP event received: ${body.eventType}${
          "organizationId" in body ? ` for org ${body.organizationId}` : ""
        }${"userId" in body && body.eventType === "user.deleted" ? ` for user ${body.userId}` : ""}`,
      );

      switch (body.eventType) {
        case "organization.created":
          await handleOrganizationCreated(body);
          break;
        case "organization.deleted":
          await handleOrganizationDeleted(body);
          break;
        case "member.added":
          await handleMemberAdded(body);
          break;
        case "member.removed":
          await handleMemberRemoved(body);
          break;
        case "member.role_changed":
          await handleMemberRoleChanged(body);
          break;
        case "user.deleted":
          await handleUserDeleted(body);
          break;
        default:
          console.warn(`Unknown IDP event type: ${eventType}`);
      }

      set.status = 200;
      return { received: true };
    } catch (err) {
      console.error("Error processing IDP webhook:", err);
      set.status = 500;
      return { error: "Internal Server Error" };
    }
  },
  {
    headers: t.Object({
      "x-idp-signature": t.Optional(t.String()),
      "x-idp-event": t.Optional(t.String()),
    }),
  },
);

/** Default project columns provisioned for every new organization. */
const DEFAULT_PROJECT_COLUMNS = [
  { emoji: "🗓", title: "Planned", index: 0 },
  { emoji: "🚧", title: "In Progress", index: 1 },
  { emoji: "✅", title: "Completed", index: 2 },
] as const;

/**
 * Handle organization created event.
 * Provisions default project columns and settings for the organization.
 */
async function handleOrganizationCreated(
  payload: OrganizationCreatedPayload,
): Promise<void> {
  const { organizationId, organizationType } = payload;

  // Provision project columns
  try {
    const existingColumns = await dbPool.query.projectColumns.findFirst({
      where: (table, { eq }) => eq(table.organizationId, organizationId),
      columns: { id: true },
    });

    if (existingColumns) {
      // biome-ignore lint/suspicious/noConsole: webhook logging
      console.log(
        `Project columns already exist for org ${organizationId}, skipping`,
      );
    } else {
      await dbPool.insert(projectColumns).values(
        DEFAULT_PROJECT_COLUMNS.map((col) => ({
          organizationId,
          emoji: col.emoji,
          title: col.title,
          index: col.index,
        })),
      );

      // biome-ignore lint/suspicious/noConsole: webhook logging
      console.log(
        `Provisioned default project columns for ${organizationType} org ${organizationId}`,
      );
    }
  } catch (err) {
    console.error(
      `Failed to provision project columns for org ${organizationId}:`,
      err,
    );
  }

  // Provision settings
  try {
    const existingSettings = await dbPool.query.settings.findFirst({
      where: (table, { eq }) => eq(table.organizationId, organizationId),
      columns: { id: true },
    });

    if (existingSettings) {
      // biome-ignore lint/suspicious/noConsole: webhook logging
      console.log(`Settings already exist for org ${organizationId}, skipping`);
    } else {
      await dbPool.insert(settings).values({
        organizationId,
        viewMode: "board",
      });

      // biome-ignore lint/suspicious/noConsole: webhook logging
      console.log(
        `Provisioned default settings for ${organizationType} org ${organizationId}`,
      );
    }
  } catch (err) {
    console.error(
      `Failed to provision settings for org ${organizationId}:`,
      err,
    );
  }
}

/**
 * Handle organization deleted event.
 * Soft-deletes the associated settings record.
 */
async function handleOrganizationDeleted(
  payload: OrganizationDeletedPayload,
): Promise<void> {
  const { organizationId, deletedAt } = payload;

  try {
    const result = await dbPool
      .update(settings)
      .set({
        deletedAt: new Date(deletedAt),
        deletionReason: "organization_deleted",
      })
      .where(eq(settings.organizationId, organizationId))
      .returning({ id: settings.id });

    if (result.length > 0) {
      // biome-ignore lint/suspicious/noConsole: webhook logging
      console.log(
        `Soft-deleted settings ${result[0].id} (org ${organizationId} deleted)`,
      );
    } else {
      // biome-ignore lint/suspicious/noConsole: webhook logging
      console.log(
        `No settings found for deleted org ${organizationId} (may not exist in this app)`,
      );
    }
  } catch (err) {
    console.error(
      `Failed to soft-delete settings for org ${organizationId}:`,
      err,
    );
    throw err;
  }
}

/**
 * Handle member added event.
 * Invalidates permission cache for the affected user.
 */
async function handleMemberAdded(payload: MemberAddedPayload): Promise<void> {
  const { organizationId, userId, role } = payload;

  invalidatePermissionCache(`${userId}:organization:${organizationId}:`);

  // biome-ignore lint/suspicious/noConsole: webhook logging
  console.log(
    `Member ${userId} added to org ${organizationId} with role ${role} - cache invalidated`,
  );
}

/**
 * Handle member removed event.
 * Invalidates permission cache for the affected user.
 */
async function handleMemberRemoved(
  payload: MemberRemovedPayload,
): Promise<void> {
  const { organizationId, userId } = payload;

  invalidatePermissionCache(`${userId}:organization:${organizationId}:`);

  // Also invalidate project-level permissions for this user
  // Since we can't enumerate all projects, invalidate all permissions for user
  invalidatePermissionCache(`${userId}:`);

  // biome-ignore lint/suspicious/noConsole: webhook logging
  console.log(
    `Member ${userId} removed from org ${organizationId} - cache invalidated`,
  );
}

/**
 * Handle member role changed event.
 * Invalidates permission cache for the affected user.
 */
async function handleMemberRoleChanged(
  payload: MemberRoleChangedPayload,
): Promise<void> {
  const { organizationId, userId, oldRole, newRole } = payload;

  invalidatePermissionCache(`${userId}:`);

  // biome-ignore lint/suspicious/noConsole: webhook logging
  console.log(
    `Member ${userId} role changed in org ${organizationId}: ${oldRole} → ${newRole} - cache invalidated`,
  );
}

/**
 * Handle user deleted event.
 * Deletes the local user record (cascades to user preferences).
 * This is a hard delete since the user has been removed from the IDP.
 */
async function handleUserDeleted(payload: UserDeletedPayload): Promise<void> {
  const { userId } = payload;

  try {
    // Invalidate all cached permissions for this user first
    invalidatePermissionCache(`${userId}:`);

    // Delete the user record (cascades to user_preferences via FK)
    const result = await dbPool
      .delete(users)
      .where(eq(users.identityProviderId, userId))
      .returning({ id: users.id });

    if (result.length > 0) {
      // biome-ignore lint/suspicious/noConsole: webhook logging
      console.log(
        `Deleted user ${result[0].id} (IDP user ${userId} was deleted)`,
      );
    } else {
      // biome-ignore lint/suspicious/noConsole: webhook logging
      console.log(
        `No local user found for IDP user ${userId} (may not exist in this app)`,
      );
    }
  } catch (err) {
    console.error(`Failed to delete user for IDP user ${userId}:`, err);
    throw err;
  }
}

export default idpWebhook;
