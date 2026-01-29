/**
 * Elysia guard that handles JWT authentication.
 *
 * Validates the Bearer token from the Authorization header and resolves
 * the authenticated user context including their organization claims.
 */

import { Elysia, t } from "elysia";

import { authenticateRequest } from "../auth";

import type { AuthContext } from "./types";

/**
 * Guard that authenticates requests via Bearer token.
 *
 * Adds an `auth` object to the request context containing:
 * - user: The authenticated user from the database
 * - organizations: Array of organization claims from the JWT
 * - accessToken: The raw access token for downstream API calls
 *
 * Returns 401 if authentication fails.
 */
export const authGuard = new Elysia({ name: "guard:auth" })
  .guard({
    headers: t.Object(
      {
        // biome-ignore lint/suspicious/noTemplateCurlyInString: TypeBox template literal syntax
        authorization: t.TemplateLiteral("Bearer ${string}"),
      },
      { additionalProperties: true },
    ),
  })
  .resolve(
    { as: "scoped" },
    async ({ request, set }): Promise<{ auth: AuthContext }> => {
      try {
        const result = await authenticateRequest(request);

        return {
          auth: {
            user: result.user,
            organizations: result.organizations,
            accessToken: result.accessToken,
          },
        };
      } catch (err) {
        set.status = 401;
        throw new Error(
          err instanceof Error ? err.message : "Authentication failed",
        );
      }
    },
  );
