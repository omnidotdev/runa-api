import { useGenericAuth } from "@envelop/generic-auth";
import {
  verifyAccessToken as verifyJwksToken,
  verifySelfHostedToken as verifySymmetricToken,
} from "@omnidotdev/providers";
import {
  AuthenticationError,
  createAuthQueryClient,
  createGetOrganizationClaimsFromCache,
  extractBearerToken,
  isIntrospectionQuery,
  validateClaims,
} from "@omnidotdev/providers/graphql";

import {
  AUTH_BASE_URL,
  isDevEnv,
  isSelfHosted,
  protectRoutes,
} from "lib/config/env.config";
import { users } from "lib/db/schema";
import { provisionPersonalOrganization } from "lib/provisioning/selfHosted";

import type { ResolveUserFn } from "@envelop/generic-auth";
import type { UserInfoClaims } from "@omnidotdev/providers";
import type { InsertUser, SelectUser } from "lib/db/schema";
import type { GraphQLContext } from "lib/graphql/createGraphqlContext";

const queryClient = createAuthQueryClient();

/** Extract organization claims from cached userinfo for a given access token */
export const getOrganizationClaimsFromCache =
  createGetOrganizationClaimsFromCache(queryClient);

/**
 * Verify self-hosted JWT signed with AUTH_SECRET.
 * Wraps the shared provider function with Runa-specific config.
 */
async function verifySelfHostedToken(token: string): Promise<UserInfoClaims> {
  const { AUTH_SECRET, AUTH_SECRET_PREVIOUS } = process.env;
  if (!AUTH_SECRET) {
    throw new AuthenticationError(
      "AUTH_SECRET not configured",
      "AUTH_SECRET_MISSING",
    );
  }

  return verifySymmetricToken(token, {
    secret: AUTH_SECRET,
    previousSecret: AUTH_SECRET_PREVIOUS,
    salt: "runa-self-hosted-auth",
  });
}

/**
 * Verify JWT signature using Gatekeeper's JWKS endpoint.
 * Wraps the shared provider function with Runa-specific config.
 */
async function verifyAccessToken(token: string): Promise<UserInfoClaims> {
  if (!AUTH_BASE_URL) {
    throw new AuthenticationError(
      "AUTH_BASE_URL is not configured",
      "AUTH_CONFIG_MISSING",
    );
  }

  return verifyJwksToken(token, { authBaseUrl: AUTH_BASE_URL });
}

/**
 * Validate user session and resolve user if successful.
 * @see https://the-guild.dev/graphql/envelop/plugins/use-generic-auth#getting-started
 */
const resolveUser: ResolveUserFn<SelectUser, GraphQLContext> = async (ctx) => {
  try {
    const accessToken = extractBearerToken(
      ctx.request.headers.get("authorization"),
    );

    if (!accessToken) {
      if (!protectRoutes) return null;

      // Allow unauthenticated introspection queries in development (e.g., for graphql-codegen)
      if (isDevEnv) {
        const params = (ctx as { params?: { query?: string } }).params;
        if (isIntrospectionQuery(params?.query)) return null;
      }

      throw new AuthenticationError(
        "Invalid or missing access token",
        "MISSING_TOKEN",
      );
    }

    let claims: UserInfoClaims;

    // Self-hosted mode: verify JWT signed with shared AUTH_SECRET
    if (isSelfHosted) {
      claims = await verifySelfHostedToken(accessToken);
      validateClaims(claims);

      // Populate cache so organizationsPlugin can read org claims
      queryClient.setQueryData(["UserInfo", { accessToken }], claims);
    } else {
      // SaaS mode: validate via external IDP
      // Better Auth OIDC access tokens are opaque tokens, not JWTs.
      // Validation is done via the userinfo endpoint which verifies the token server-side.
      // If the access token looks like a JWT (3 dot-separated parts), we can optionally
      // verify it for additional security, but this is not required.
      const isJwtFormat = accessToken.split(".").length === 3;
      if (isJwtFormat) {
        try {
          const verifiedPayload = await verifyAccessToken(accessToken);
          validateClaims(verifiedPayload, {
            expectedIssuer: AUTH_BASE_URL,
          });
        } catch (jwtError) {
          // JWT verification failed - this is expected for opaque tokens
          // Continue with userinfo validation which will definitively validate the token
          console.warn(
            "[Auth] JWT verification skipped (opaque token):",
            jwtError instanceof Error ? jwtError.message : jwtError,
          );
        }
      }

      // Fetch user claims from userinfo endpoint - this validates the access token
      // and provides the authoritative user identity claims
      claims = await queryClient.ensureQueryData({
        queryKey: ["UserInfo", { accessToken }],
        queryFn: async () => {
          const response = await fetch(`${AUTH_BASE_URL}/oauth2/userinfo`, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          });

          if (!response.ok) {
            throw new AuthenticationError(
              "Invalid access token or request failed",
              "USERINFO_FAILED",
            );
          }

          const userInfoClaims: UserInfoClaims = await response.json();

          return userInfoClaims;
        },
      });

      if (!claims) {
        if (!protectRoutes) return null;

        throw new AuthenticationError(
          "Invalid access token or request failed",
          "INVALID_CLAIMS",
        );
      }
    }

    if (!claims.email)
      throw new AuthenticationError(
        "Missing required 'email' claim",
        "MISSING_EMAIL_CLAIM",
      );

    const insertedUser: InsertUser = {
      identityProviderId: claims.sub,
      name: claims.name ?? claims.preferred_username ?? claims.email,
      avatarUrl: claims.picture,
      email: claims.email,
    };

    const { identityProviderId, ...rest } = insertedUser;

    const [user] = await ctx.db
      .insert(users)
      .values(insertedUser)
      .onConflictDoUpdate({
        target: users.identityProviderId,
        set: {
          ...rest,
          updatedAt: new Date().toISOString(),
        },
      })
      .returning();

    // Self-hosted only: auto-provision personal workspace if user has none.
    // SaaS mode: orgs come from HIDRA Gatekeeper via JWT claims and webhooks.
    if (isSelfHosted) {
      await provisionPersonalOrganization({
        db: ctx.db,
        userId: user.id,
        identityProviderId: user.identityProviderId,
        userName: user.name,
        userEmail: user.email,
      });
    }

    return user;
  } catch (err) {
    if (err instanceof AuthenticationError) {
      console.error(`[Auth] ${err.code}: ${err.message}`);
    } else {
      console.error("[Auth] Unexpected error:", err);
    }

    return null;
  }
};

/**
 * Authentication plugin.
 *
 * Uses "resolve-only" mode to allow unauthenticated queries (public board access).
 * Mutations are protected by authorization plugins that check for observer.
 *
 * @see https://the-guild.dev/graphql/envelop/plugins/use-generic-auth
 */
const authenticationPlugin = useGenericAuth({
  contextFieldName: "observer",
  resolveUserFn: resolveUser,
  mode: "resolve-only",
});

export default authenticationPlugin;
