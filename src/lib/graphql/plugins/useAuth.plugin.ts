import { useGenericAuth } from "@envelop/generic-auth";
import { QueryClient } from "@tanstack/query-core";
import type * as jose from "jose";

import { AUTH_BASE_URL, protectRoutes } from "lib/config/env.config";
import { userTable } from "lib/db/schema";

import type { ResolveUserFn } from "@envelop/generic-auth";
import type { InsertUser, SelectUser } from "lib/db/schema";
import type { GraphQLContext } from "lib/graphql/createGraphqlContext";

// TODO research best practices for all of this file (token validation, caching, etc.). Validate access token (introspection endpoint)? Cache userinfo output? etc. (https://linear.app/omnidev/issue/OMNI-302/increase-security-of-useauth-plugin)

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      staleTime: 1000 * 60 * 5,
    },
  },
});

/**
 * Validate user session and resolve user if successful.
 * @see https://the-guild.dev/graphql/envelop/plugins/use-generic-auth#getting-started
 */
const resolveUser: ResolveUserFn<SelectUser, GraphQLContext> = async (ctx) => {
  try {
    const accessToken = ctx.request.headers
      .get("authorization")
      ?.split("Bearer ")[1];

    if (!accessToken) {
      if (!protectRoutes) return null;

      throw new Error("Invalid or missing access token");
    }

    // TODO validate access token (introspection endpoint?) here?

    const idToken = await queryClient.ensureQueryData({
      queryKey: ["UserInfo", { accessToken }],
      queryFn: async () => {
        const response = await fetch(`${AUTH_BASE_URL}/oauth2/userinfo`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!response.ok) {
          if (!protectRoutes) return null;

          throw new Error("Invalid access token or request failed");
        }

        const idToken: jose.JWTPayload = await response.json();

        // TODO validate token, currently major security flaw (pending BA OIDC JWKS support: https://www.better-auth.com/docs/plugins/oidc-provider#jwks-endpoint-not-fully-implemented) (https://linear.app/omnidev/issue/OMNI-302/validate-id-token-with-jwks)
        // const jwks = jose.createRemoteJWKSet(new URL(`${AUTH_BASE_URL}/jwks`));
        // const { payload } = await jose.jwtVerify(JSON.stringify(idToken), jwks);
        // if (!payload) throw new Error("Failed to verify token");

        return idToken;
      },
    });

    if (!idToken) {
      if (!protectRoutes) return null;

      throw new Error("Invalid access token or request failed");
    }

    const insertedUser: InsertUser = {
      identityProviderId: idToken.sub!,
      name: idToken.preferred_username as string,
      email: idToken.email as string,
    };

    const { identityProviderId, ...rest } = insertedUser;

    const [user] = await ctx.db
      .insert(userTable)
      .values(insertedUser)
      .onConflictDoUpdate({
        target: userTable.identityProviderId,
        set: {
          ...rest,
          updatedAt: new Date().toISOString(),
        },
      })
      .returning();

    return user;
  } catch (err) {
    console.error(err);

    return null;
  }
};

/**
 * Authentication plugin.
 */
const useAuth = () =>
  useGenericAuth({
    contextFieldName: "observer",
    resolveUserFn: resolveUser,
    mode: protectRoutes ? "protect-all" : "resolve-only",
  });

export default useAuth;
