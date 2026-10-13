/**
 * Webhook endpoint management service. The GraphQL layer
 * (WebhookEndpoint.plugin) authorizes the caller (workspace admin) and delegates
 * the data work here. Every mutation is scoped to an organization id so a caller
 * can never touch another workspace's endpoint even by guessing its id, and the
 * signing secret is generated server-side and returned exactly once (on create
 * and rotate); it is never read back.
 */

import { randomBytes } from "node:crypto";

import { and, eq } from "drizzle-orm";

import { dbPool } from "lib/db/db";
import { webhookEndpoint } from "lib/db/schema";
import { assertAllowedWebhookUrl } from "lib/webhooks/ssrfGuard";

import type { SelectWebhookEndpoint } from "lib/db/schema";

/** Secret-less public view of an endpoint (safe to return from the API). */
interface WebhookEndpointInfo {
  id: string;
  url: string;
  eventTypes: string[] | null;
  enabled: boolean;
  createdAt: string;
}

const generateSecret = (): string => randomBytes(32).toString("hex");

const toInfo = (row: SelectWebhookEndpoint): WebhookEndpointInfo => ({
  id: row.id,
  url: row.url,
  eventTypes: row.eventTypes,
  enabled: row.enabled,
  createdAt: row.createdAt,
});

/** Create an endpoint; validates the URL, generates the secret, returns it once. */
export const createWebhookEndpoint = async (params: {
  organizationId: string;
  url: string;
  eventTypes?: string[] | null;
  createdBy: string;
}): Promise<{ endpoint: WebhookEndpointInfo; secret: string }> => {
  assertAllowedWebhookUrl(params.url);
  const secret = generateSecret();
  const [row] = await dbPool
    .insert(webhookEndpoint)
    .values({
      organizationId: params.organizationId,
      url: params.url,
      eventTypes: params.eventTypes ?? null,
      secret,
      createdBy: params.createdBy,
    })
    .returning();
  return { endpoint: toInfo(row!), secret };
};

/** Resolve the owning organization of an endpoint (for the authz check). */
export const webhookEndpointOrganizationId = async (
  id: string,
): Promise<string | null> => {
  const [row] = await dbPool
    .select({ organizationId: webhookEndpoint.organizationId })
    .from(webhookEndpoint)
    .where(eq(webhookEndpoint.id, id));
  return row?.organizationId ?? null;
};

/** Rotate the signing secret (org-scoped); returns the new secret once. */
export const rotateWebhookEndpointSecret = async (
  id: string,
  organizationId: string,
): Promise<string> => {
  const secret = generateSecret();
  const [row] = await dbPool
    .update(webhookEndpoint)
    .set({ secret, updatedAt: new Date().toISOString() })
    .where(
      and(
        eq(webhookEndpoint.id, id),
        eq(webhookEndpoint.organizationId, organizationId),
      ),
    )
    .returning();
  if (!row) throw new Error("Webhook endpoint not found");
  return secret;
};

/** Enable or disable an endpoint (org-scoped). */
export const setWebhookEndpointEnabled = async (
  id: string,
  organizationId: string,
  enabled: boolean,
): Promise<WebhookEndpointInfo> => {
  const [row] = await dbPool
    .update(webhookEndpoint)
    .set({ enabled, updatedAt: new Date().toISOString() })
    .where(
      and(
        eq(webhookEndpoint.id, id),
        eq(webhookEndpoint.organizationId, organizationId),
      ),
    )
    .returning();
  if (!row) throw new Error("Webhook endpoint not found");
  return toInfo(row);
};

/** Delete an endpoint (org-scoped). Returns whether a row was removed. */
export const deleteWebhookEndpoint = async (
  id: string,
  organizationId: string,
): Promise<boolean> => {
  const rows = await dbPool
    .delete(webhookEndpoint)
    .where(
      and(
        eq(webhookEndpoint.id, id),
        eq(webhookEndpoint.organizationId, organizationId),
      ),
    )
    .returning({ id: webhookEndpoint.id });
  return rows.length > 0;
};

/** List a workspace's endpoints (secret-less). */
export const listWebhookEndpoints = async (
  organizationId: string,
): Promise<WebhookEndpointInfo[]> => {
  const rows = await dbPool
    .select()
    .from(webhookEndpoint)
    .where(eq(webhookEndpoint.organizationId, organizationId));
  return rows.map(toInfo);
};
