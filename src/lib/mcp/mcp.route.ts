/**
 * Runa MCP server (Model Context Protocol), served at `POST /mcp` over
 * stateless Streamable HTTP so any MCP client can work with Runa boards.
 *
 * Auth is a workspace API token (`Authorization: Bearer runa_...`) created in
 * workspace settings. Each tool call runs its GraphQL operation through this
 * same server's `/graphql` handler with the caller's token, so the token's
 * scopes, its single workspace, and per-project permissions all apply exactly
 * as for any other API client
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { eq } from "drizzle-orm";
import { Elysia } from "elysia";

import { acceptApiTokens } from "lib/config/env.config";
import { dbPool } from "lib/db/db";
import { users } from "lib/db/schema";
import {
  INTERNAL_REQUEST_HEADER,
  INTERNAL_REQUEST_NONCE,
} from "lib/mcp/internal";
import { registerRunaTools } from "lib/mcp/tools";
import { resolveApiToken } from "lib/tokens/apiTokens";

import type { GraphqlRunner } from "lib/mcp/tools";

/** Handles a request with the full server (and so its GraphQL auth chain) */
type RequestHandler = (request: Request) => Promise<Response>;

const unauthorized = () =>
  new Response(
    JSON.stringify({
      error:
        "A workspace API token is required (Authorization: Bearer runa_...)",
    }),
    {
      status: 401,
      headers: {
        "content-type": "application/json",
        "www-authenticate": 'Bearer realm="runa-mcp"',
      },
    },
  );

/** Extract a workspace API token, ignoring calendar feed tokens */
const bearerApiToken = (request: Request): string | null => {
  const token = request.headers
    .get("authorization")
    ?.match(/^Bearer\s+(\S+)$/i)?.[1];
  if (!token?.startsWith("runa_") || token.startsWith("runa_cal_")) return null;
  return token;
};

/** Run GraphQL as the caller through the server's own GraphQL handler */
const createGraphqlRunner =
  (handle: RequestHandler, token: string): GraphqlRunner =>
  async <T>(query: string, variables?: Record<string, unknown>) => {
    const response = await handle(
      new Request("http://internal/graphql", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${token}`,
          [INTERNAL_REQUEST_HEADER]: INTERNAL_REQUEST_NONCE,
        },
        body: JSON.stringify({ query, variables }),
      }),
    );
    const body = (await response.json()) as {
      data?: T;
      errors?: { message: string }[];
    };
    if (body.errors?.length) throw new Error(body.errors[0]?.message);
    if (!body.data) throw new Error("The request failed");
    return body.data;
  };

/**
 * Mount the MCP endpoint. `handle` must be the running server's request
 * handler so tool calls traverse the same authentication, scope, and
 * authorization plugins as external GraphQL requests
 */
export const createMcpRoutes = (handle: RequestHandler) =>
  new Elysia({ name: "mcp" })
    .post("/mcp", async ({ request }) => {
      if (!acceptApiTokens) {
        return new Response(
          JSON.stringify({
            error: "API tokens are not enabled on this server",
          }),
          { status: 503, headers: { "content-type": "application/json" } },
        );
      }

      const token = bearerApiToken(request);
      if (!token) return unauthorized();

      const principal = await resolveApiToken(token);
      if (!principal) return unauthorized();

      // content the token creates is authored by the user who issued it
      const [user] = await dbPool
        .select({ id: users.id })
        .from(users)
        .where(eq(users.identityProviderId, principal.createdBy));
      if (!user) return unauthorized();

      const server = new McpServer({ name: "runa", version: "1.0.0" });
      registerRunaTools(server, {
        graphql: createGraphqlRunner(handle, token),
        userId: user.id,
        organizationId: principal.organizationId,
      });

      // stateless: a fresh server + transport per request, JSON responses
      const transport = new WebStandardStreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
        enableJsonResponse: true,
      });
      await server.connect(transport);
      return transport.handleRequest(request);
    })
    // stateless server: no SSE stream to open and no session to end
    .get(
      "/mcp",
      () => new Response(null, { status: 405, headers: { allow: "POST" } }),
    )
    .delete(
      "/mcp",
      () => new Response(null, { status: 405, headers: { allow: "POST" } }),
    );
