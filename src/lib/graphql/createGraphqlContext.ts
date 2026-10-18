import { createWithPgClient } from "postgraphile/adaptors/pg";

import { acceptApiTokens } from "lib/config/env.config";
import { dbPool, pgPool } from "lib/db/db";
import { resolveApiToken } from "lib/tokens/apiTokens";

import type { YogaInitialContext } from "graphql-yoga";
import type { OrganizationClaim } from "lib/auth/organizations";
import type { SelectUser } from "lib/db/schema";
import type { ResolvedApiToken } from "lib/tokens/apiTokens";
import type { WithPgClient } from "postgraphile/@dataplan/pg";
import type {
  NodePostgresPgClient,
  PgSubscriber,
} from "postgraphile/adaptors/pg";

const withPgClient = createWithPgClient({ pool: pgPool });

// Merge declarations for `observer` and `db` which are used within plan resolvers. See: https://grafast.org/grafast/step-library/standard-steps/context#typescript
declare global {
  namespace Grafast {
    interface Context {
      observer: SelectUser | null;
      organizations: OrganizationClaim[];
      db: typeof dbPool;
      /** Request-scoped permission cache to avoid duplicate PDP calls within a single GraphQL request. */
      authzCache: Map<string, boolean>;
      /** JWT access token for authenticating with downstream services (e.g., Warden AuthZ). */
      accessToken: string | null;
      /** Resolved API-token principal when the request bears a valid `runa_` token (and ACCEPT_API_TOKENS is on); null for a session or anonymous request. Drives per-operation scope enforcement. */
      apiTokenPrincipal: ResolvedApiToken | null;
    }
  }
}

export interface GraphQLContext {
  /** API observer, injected by the authentication plugin and controlled via `contextFieldName`. Related to the viewer pattern: https://wundergraph.com/blog/graphql_federation_viewer_pattern */
  observer: SelectUser | null;
  organizations: OrganizationClaim[];
  /** Network request. */
  request: Request;
  /** Database. */
  db: typeof dbPool;
  /** Postgres client, injected by Postgraphile. */
  withPgClient: WithPgClient<NodePostgresPgClient>;
  /** Postgres settings for the current request, injected by Postgraphile. */
  pgSettings: Record<string, string | undefined> | null;
  /** Postgres subscription client for the current request, injected by Postgraphile. */
  pgSubscriber: PgSubscriber | null;
  /** Request-scoped permission cache to avoid duplicate PDP calls within a single GraphQL request. */
  authzCache: Map<string, boolean>;
  /** JWT access token for authenticating with downstream services (e.g., Warden AuthZ). */
  accessToken: string | null;
  /** Resolved API-token principal when the request bears a valid `runa_` token (and ACCEPT_API_TOKENS is on); null otherwise. */
  apiTokenPrincipal: ResolvedApiToken | null;
}

/**
 * Create a GraphQL context.
 * @see https://graphql.org/learn/execution/#root-fields-and-resolvers
 */
const createGraphqlContext = async ({
  request,
}: Omit<YogaInitialContext, "waitUntil">): Promise<
  Omit<
    GraphQLContext,
    "observer" | "organizations" | "pgSettings" | "pgSubscriber"
  >
> => {
  const accessToken =
    request.headers.get("authorization")?.split("Bearer ")[1] ?? null;

  // When API-token acceptance is enabled, resolve a `runa_` bearer to its
  // principal here (a calendar-feed `runa_cal_` token is NOT an API token and
  // is excluded). The principal drives observer resolution + scope enforcement;
  // an invalid/revoked token resolves to null and the request stays anonymous.
  let apiTokenPrincipal: ResolvedApiToken | null = null;
  if (
    acceptApiTokens &&
    accessToken?.startsWith("runa_") &&
    !accessToken.startsWith("runa_cal_")
  ) {
    apiTokenPrincipal = await resolveApiToken(accessToken);
  }

  return {
    request,
    db: dbPool,
    withPgClient,
    authzCache: new Map<string, boolean>(),
    accessToken,
    apiTokenPrincipal,
  };
};

export default createGraphqlContext;
