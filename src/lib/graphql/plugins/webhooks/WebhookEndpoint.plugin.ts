import { EXPORTABLE } from "graphile-export";
import { context, lambda } from "postgraphile/grafast";
import { gql, makeExtendSchemaPlugin } from "postgraphile/utils";

import { checkPermission } from "lib/authz";
import {
  createWebhookEndpoint,
  deleteWebhookEndpoint,
  rotateWebhookEndpointSecret,
  setWebhookEndpointEnabled,
  webhookEndpointOrganizationId,
} from "lib/webhooks/endpoints";

/**
 * Authorized management API for webhook endpoints. The endpoint table is hidden
 * from auto-CRUD (SmartTag `-*`) because it holds a signing secret; these custom
 * mutations are the only way to manage it. Each requires workspace `admin`
 * (checked against the endpoint's owning organization), the secret is generated
 * server-side and returned ONLY on create and rotate, and the service layer
 * scopes every write to that organization. A listing query is intentionally
 * deferred to the management UI slice.
 */

/** Reads one property off a returned plain-object result (or null). */
const rowField = (key: string) =>
  EXPORTABLE(
    (lambda, key) =>
      // biome-ignore lint/suspicious/noExplicitAny: grafast plan step
      ($row: any) =>
        lambda(
          $row,
          (r) => (r as Record<string, unknown> | null)?.[key] ?? null,
        ),
    [lambda, key],
  );

const WebhookEndpointPlugin = makeExtendSchemaPlugin(() => ({
  typeDefs: gql`
    "A webhook endpoint, without its signing secret."
    type WebhookEndpointInfo {
      id: UUID
      url: String
      eventTypes: [String!]
      enabled: Boolean
      createdAt: String
    }

    "Create result. The secret is shown only here and on rotate; store it now."
    type CreateWebhookEndpointPayload {
      id: UUID
      url: String
      enabled: Boolean
      secret: String
    }

    "Rotate result. The new secret is shown only here."
    type RotateWebhookEndpointSecretPayload {
      id: UUID
      secret: String
    }

    type DeleteWebhookEndpointPayload {
      id: UUID
      deleted: Boolean
    }

    input CreateWebhookEndpointInput {
      "Owning workspace (organization id)."
      organizationId: String!
      "Destination URL (must be a public http(s) host)."
      url: String!
      "Optional event-type whitelist; omit for all events."
      eventTypes: [String!]
    }

    input RotateWebhookEndpointSecretInput {
      id: UUID!
    }

    input SetWebhookEndpointEnabledInput {
      id: UUID!
      enabled: Boolean!
    }

    input DeleteWebhookEndpointInput {
      id: UUID!
    }

    extend type Mutation {
      "Register a webhook endpoint for a workspace (requires workspace admin)."
      createWebhookEndpoint(
        input: CreateWebhookEndpointInput!
      ): CreateWebhookEndpointPayload
      "Rotate an endpoint's signing secret (requires workspace admin)."
      rotateWebhookEndpointSecret(
        input: RotateWebhookEndpointSecretInput!
      ): RotateWebhookEndpointSecretPayload
      "Enable or disable an endpoint (requires workspace admin)."
      setWebhookEndpointEnabled(
        input: SetWebhookEndpointEnabledInput!
      ): WebhookEndpointInfo
      "Delete an endpoint (requires workspace admin)."
      deleteWebhookEndpoint(
        input: DeleteWebhookEndpointInput!
      ): DeleteWebhookEndpointPayload
    }
  `,
  plans: {
    CreateWebhookEndpointPayload: {
      id: rowField("id"),
      url: rowField("url"),
      enabled: rowField("enabled"),
      secret: rowField("secret"),
    },
    RotateWebhookEndpointSecretPayload: {
      id: rowField("id"),
      secret: rowField("secret"),
    },
    WebhookEndpointInfo: {
      id: rowField("id"),
      url: rowField("url"),
      eventTypes: rowField("eventTypes"),
      enabled: rowField("enabled"),
      createdAt: rowField("createdAt"),
    },
    DeleteWebhookEndpointPayload: {
      id: rowField("id"),
      deleted: rowField("deleted"),
    },
    Mutation: {
      createWebhookEndpoint: EXPORTABLE(
        (context, lambda, checkPermission, createWebhookEndpoint) =>
          // biome-ignore lint/suspicious/noExplicitAny: grafast plan signature
          (_$root: any, fieldArgs: any) => {
            const $input = fieldArgs.getRaw("input");
            const $observer = context().get("observer");
            const $accessToken = context().get("accessToken");
            const $authzCache = context().get("authzCache");
            return lambda(
              [$observer, $accessToken, $authzCache, $input],
              // biome-ignore lint/suspicious/noExplicitAny: grafast lambda values
              async ([observer, accessToken, authzCache, input]: any) => {
                if (!observer || !accessToken) throw new Error("Unauthorized");
                const ok = await checkPermission(
                  observer.identityProviderId,
                  "organization",
                  input.organizationId,
                  "admin",
                  accessToken,
                  authzCache,
                );
                if (!ok) throw new Error("Unauthorized");
                const { endpoint, secret } = await createWebhookEndpoint({
                  organizationId: input.organizationId,
                  url: input.url,
                  eventTypes: input.eventTypes ?? null,
                  createdBy: observer.identityProviderId,
                });
                return {
                  id: endpoint.id,
                  url: endpoint.url,
                  enabled: endpoint.enabled,
                  secret,
                };
              },
              false,
            );
          },
        [context, lambda, checkPermission, createWebhookEndpoint],
      ),
      rotateWebhookEndpointSecret: EXPORTABLE(
        (
          context,
          lambda,
          checkPermission,
          rotateWebhookEndpointSecret,
          webhookEndpointOrganizationId,
        ) =>
          // biome-ignore lint/suspicious/noExplicitAny: grafast plan signature
          (_$root: any, fieldArgs: any) => {
            const $input = fieldArgs.getRaw("input");
            const $observer = context().get("observer");
            const $accessToken = context().get("accessToken");
            const $authzCache = context().get("authzCache");
            return lambda(
              [$observer, $accessToken, $authzCache, $input],
              // biome-ignore lint/suspicious/noExplicitAny: grafast lambda values
              async ([observer, accessToken, authzCache, input]: any) => {
                if (!observer || !accessToken) throw new Error("Unauthorized");
                const organizationId = await webhookEndpointOrganizationId(
                  input.id,
                );
                if (!organizationId) throw new Error("Not found");
                const ok = await checkPermission(
                  observer.identityProviderId,
                  "organization",
                  organizationId,
                  "admin",
                  accessToken,
                  authzCache,
                );
                if (!ok) throw new Error("Unauthorized");
                const secret = await rotateWebhookEndpointSecret(
                  input.id,
                  organizationId,
                );
                return { id: input.id, secret };
              },
              false,
            );
          },
        [
          context,
          lambda,
          checkPermission,
          rotateWebhookEndpointSecret,
          webhookEndpointOrganizationId,
        ],
      ),
      setWebhookEndpointEnabled: EXPORTABLE(
        (
          context,
          lambda,
          checkPermission,
          setWebhookEndpointEnabled,
          webhookEndpointOrganizationId,
        ) =>
          // biome-ignore lint/suspicious/noExplicitAny: grafast plan signature
          (_$root: any, fieldArgs: any) => {
            const $input = fieldArgs.getRaw("input");
            const $observer = context().get("observer");
            const $accessToken = context().get("accessToken");
            const $authzCache = context().get("authzCache");
            return lambda(
              [$observer, $accessToken, $authzCache, $input],
              // biome-ignore lint/suspicious/noExplicitAny: grafast lambda values
              async ([observer, accessToken, authzCache, input]: any) => {
                if (!observer || !accessToken) throw new Error("Unauthorized");
                const organizationId = await webhookEndpointOrganizationId(
                  input.id,
                );
                if (!organizationId) throw new Error("Not found");
                const ok = await checkPermission(
                  observer.identityProviderId,
                  "organization",
                  organizationId,
                  "admin",
                  accessToken,
                  authzCache,
                );
                if (!ok) throw new Error("Unauthorized");
                return setWebhookEndpointEnabled(
                  input.id,
                  organizationId,
                  input.enabled,
                );
              },
              false,
            );
          },
        [
          context,
          lambda,
          checkPermission,
          setWebhookEndpointEnabled,
          webhookEndpointOrganizationId,
        ],
      ),
      deleteWebhookEndpoint: EXPORTABLE(
        (
          context,
          lambda,
          checkPermission,
          deleteWebhookEndpoint,
          webhookEndpointOrganizationId,
        ) =>
          // biome-ignore lint/suspicious/noExplicitAny: grafast plan signature
          (_$root: any, fieldArgs: any) => {
            const $input = fieldArgs.getRaw("input");
            const $observer = context().get("observer");
            const $accessToken = context().get("accessToken");
            const $authzCache = context().get("authzCache");
            return lambda(
              [$observer, $accessToken, $authzCache, $input],
              // biome-ignore lint/suspicious/noExplicitAny: grafast lambda values
              async ([observer, accessToken, authzCache, input]: any) => {
                if (!observer || !accessToken) throw new Error("Unauthorized");
                const organizationId = await webhookEndpointOrganizationId(
                  input.id,
                );
                if (!organizationId) throw new Error("Not found");
                const ok = await checkPermission(
                  observer.identityProviderId,
                  "organization",
                  organizationId,
                  "admin",
                  accessToken,
                  authzCache,
                );
                if (!ok) throw new Error("Unauthorized");
                const deleted = await deleteWebhookEndpoint(
                  input.id,
                  organizationId,
                );
                return { id: input.id, deleted };
              },
              false,
            );
          },
        [
          context,
          lambda,
          checkPermission,
          deleteWebhookEndpoint,
          webhookEndpointOrganizationId,
        ],
      ),
    },
  },
}));

export default WebhookEndpointPlugin;
