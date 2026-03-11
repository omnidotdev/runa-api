/**
 * GitHub App webhook handler.
 *
 * Receives installation lifecycle events from GitHub.
 * HMAC-SHA256 verified (same pattern as IDP/entitlements webhooks).
 */

import { createHmac, timingSafeEqual } from "node:crypto";

import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { GITHUB_WEBHOOK_SECRET } from "lib/config/env.config";
import { dbPool } from "lib/db/db";
import { githubInstallations } from "lib/db/schema";
import { invalidateInstallationToken } from "./client";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface InstallationAccount {
  id: number;
  login: string;
  type: "Organization" | "User";
}

interface InstallationEvent {
  action: "created" | "deleted" | "suspend" | "unsuspend";
  installation: {
    id: number;
    account: InstallationAccount;
  };
}

// ─────────────────────────────────────────────
// Signature Verification
// ─────────────────────────────────────────────

/**
 * Verify GitHub webhook signature (SHA-256).
 * GitHub sends the signature as "sha256=<hex>".
 */
export const verifyGitHubSignature = (
  payload: string,
  signature: string,
  secret: string,
): boolean => {
  try {
    const expectedSignature = createHmac("sha256", secret)
      .update(payload)
      .digest("hex");

    const expected = `sha256=${expectedSignature}`;

    if (signature.length !== expected.length) {
      return false;
    }

    return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
};

// ─────────────────────────────────────────────
// Webhook Route
// ─────────────────────────────────────────────

/**
 * GitHub webhook receiver.
 * Handles GitHub App installation lifecycle events.
 *
 * Note: The organizationId mapping must be provided via a query parameter
 * in the webhook URL configured in the GitHub App settings, since GitHub
 * doesn't know about Runa's internal organization IDs.
 */
const githubWebhook = new Elysia({ prefix: "/webhooks" }).post(
  "/github",
  async ({ request, headers, query, set }) => {
    const signature = headers["x-hub-signature-256"];
    const eventType = headers["x-github-event"];

    if (!GITHUB_WEBHOOK_SECRET) {
      console.warn(
        "GITHUB_WEBHOOK_SECRET not set - skipping signature verification",
      );
    }

    try {
      const rawBody = await request.text();

      // Verify signature
      if (GITHUB_WEBHOOK_SECRET && signature) {
        const isValid = verifyGitHubSignature(
          rawBody,
          signature,
          GITHUB_WEBHOOK_SECRET,
        );

        if (!isValid) {
          set.status = 401;
          return { error: "Invalid signature" };
        }
      } else if (GITHUB_WEBHOOK_SECRET && !signature) {
        set.status = 401;
        return { error: "Missing signature" };
      }

      // Only handle installation events
      if (eventType !== "installation") {
        set.status = 200;
        return { received: true, ignored: true };
      }

      const body = JSON.parse(rawBody) as InstallationEvent;
      const organizationId = query.organizationId;

      if (!organizationId) {
        console.error("GitHub webhook missing organizationId query parameter");
        set.status = 400;
        return { error: "Missing organizationId query parameter" };
      }

      // biome-ignore lint/suspicious/noConsole: webhook logging
      console.log(
        `GitHub event received: installation.${body.action} for ${body.installation.account.login} (org ${organizationId})`,
      );

      switch (body.action) {
        case "created":
          await handleInstallationCreated(body, organizationId);
          break;
        case "deleted":
          await handleInstallationDeleted(body, organizationId);
          break;
        default:
          // biome-ignore lint/suspicious/noConsole: webhook logging
          console.log(`Ignoring installation action: ${body.action}`);
      }

      set.status = 200;
      return { received: true };
    } catch (err) {
      console.error("Error processing GitHub webhook:", err);
      set.status = 500;
      return { error: "Internal Server Error" };
    }
  },
  {
    headers: t.Object({
      "x-hub-signature-256": t.Optional(t.String()),
      "x-github-event": t.Optional(t.String()),
    }),
    query: t.Object({
      organizationId: t.Optional(t.String()),
    }),
  },
);

// ─────────────────────────────────────────────
// Event Handlers
// ─────────────────────────────────────────────

/**
 * Handle GitHub App installation created.
 * Upserts the installation record for the organization.
 */
async function handleInstallationCreated(
  event: InstallationEvent,
  organizationId: string,
): Promise<void> {
  const { installation } = event;

  try {
    // Upsert: create or re-enable if previously deleted
    const existing = await dbPool.query.githubInstallations.findFirst({
      where: (table, { eq }) => eq(table.organizationId, organizationId),
    });

    if (existing) {
      await dbPool
        .update(githubInstallations)
        .set({
          installationId: installation.id,
          githubOrgLogin: installation.account.login,
          githubOrgId: installation.account.id,
          enabled: true,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(githubInstallations.organizationId, organizationId));

      // biome-ignore lint/suspicious/noConsole: webhook logging
      console.log(`Re-enabled GitHub installation for org ${organizationId}`);
    } else {
      await dbPool.insert(githubInstallations).values({
        organizationId,
        installationId: installation.id,
        githubOrgLogin: installation.account.login,
        githubOrgId: installation.account.id,
        enabled: true,
      });

      // biome-ignore lint/suspicious/noConsole: webhook logging
      console.log(`Created GitHub installation for org ${organizationId}`);
    }
  } catch (err) {
    console.error(
      `Failed to handle installation.created for org ${organizationId}:`,
      err,
    );
    throw err;
  }
}

/**
 * Handle GitHub App installation deleted.
 * Disables the installation (soft-delete).
 */
async function handleInstallationDeleted(
  event: InstallationEvent,
  organizationId: string,
): Promise<void> {
  const { installation } = event;

  try {
    await dbPool
      .update(githubInstallations)
      .set({
        enabled: false,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(githubInstallations.organizationId, organizationId));

    // Invalidate cached token
    invalidateInstallationToken(installation.id);

    // biome-ignore lint/suspicious/noConsole: webhook logging
    console.log(`Disabled GitHub installation for org ${organizationId}`);
  } catch (err) {
    console.error(
      `Failed to handle installation.deleted for org ${organizationId}:`,
      err,
    );
    throw err;
  }
}

export default githubWebhook;
