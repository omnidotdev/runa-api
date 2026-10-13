import { EXPORTABLE } from "graphile-export";
import { context, lambda } from "postgraphile/grafast";
import { gql, makeExtendSchemaPlugin } from "postgraphile/utils";

import { checkPermission } from "lib/authz";
import {
  apiTokenOrganizationId,
  createApiToken,
  revokeApiToken,
} from "lib/tokens/apiTokens";

/**
 * Authorized management API for workspace API tokens. The token table is hidden
 * from auto-CRUD (SmartTag `-*`) because it holds token hashes; these mutations
 * are the only surface. Each requires workspace `admin` (checked against the
 * token's owning organization), the plaintext is generated server-side and
 * returned ONLY on create, and the service scopes every write to that org. A
 * listing query is deferred to the management UI slice.
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

const ApiTokenPlugin = makeExtendSchemaPlugin(() => ({
  typeDefs: gql`
    "Create result. The token plaintext is shown only here; store it now."
    type CreateApiTokenPayload {
      id: UUID
      name: String
      "The token plaintext (runa_...). Never retrievable again."
      token: String
    }

    type RevokeApiTokenPayload {
      id: UUID
      revoked: Boolean
    }

    input CreateApiTokenInput {
      "Owning workspace (organization id)."
      organizationId: String!
      "Human label for the token."
      name: String!
      "Granted scopes (e.g. [\\"task:read\\"])."
      scopes: [String!]!
    }

    input RevokeApiTokenInput {
      id: UUID!
    }

    extend type Mutation {
      "Issue a scoped API token for a workspace (requires workspace admin)."
      createApiToken(input: CreateApiTokenInput!): CreateApiTokenPayload
      "Revoke an API token (requires workspace admin)."
      revokeApiToken(input: RevokeApiTokenInput!): RevokeApiTokenPayload
    }
  `,
  plans: {
    CreateApiTokenPayload: {
      id: rowField("id"),
      name: rowField("name"),
      token: rowField("token"),
    },
    RevokeApiTokenPayload: {
      id: rowField("id"),
      revoked: rowField("revoked"),
    },
    Mutation: {
      createApiToken: EXPORTABLE(
        (context, lambda, checkPermission, createApiToken) =>
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
                const { token, secret } = await createApiToken({
                  organizationId: input.organizationId,
                  name: input.name,
                  scopes: input.scopes,
                  createdBy: observer.identityProviderId,
                });
                return { id: token.id, name: token.name, token: secret };
              },
              false,
            );
          },
        [context, lambda, checkPermission, createApiToken],
      ),
      revokeApiToken: EXPORTABLE(
        (
          context,
          lambda,
          checkPermission,
          revokeApiToken,
          apiTokenOrganizationId,
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
                const organizationId = await apiTokenOrganizationId(input.id);
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
                const revoked = await revokeApiToken(input.id, organizationId);
                return { id: input.id, revoked };
              },
              false,
            );
          },
        [
          context,
          lambda,
          checkPermission,
          revokeApiToken,
          apiTokenOrganizationId,
        ],
      ),
    },
  },
}));

export default ApiTokenPlugin;
