import { cors } from "@elysiajs/cors";
import { yoga } from "@elysiajs/graphql-yoga";
import { useOpenTelemetry } from "@envelop/opentelemetry";
import { useParserCache } from "@envelop/parser-cache";
import { useValidationCache } from "@envelop/validation-cache";
import { useDisableIntrospection } from "@graphql-yoga/plugin-disable-introspection";
import { Elysia } from "elysia";
import { schema } from "generated/graphql/schema.executable";
import { useGrafast } from "grafast/envelop";

import appConfig from "lib/config/app.config";
import {
  AUTHZ_ENABLED,
  AUTHZ_PROVIDER_URL,
  CORS_ALLOWED_ORIGINS,
  PORT,
  isDevEnv,
  isProdEnv,
} from "lib/config/env.config";
import entitlementsWebhook from "lib/entitlements/webhooks";
import createGraphqlContext from "lib/graphql/createGraphqlContext";
import { armorPlugin, authenticationPlugin } from "lib/graphql/plugins";

/** Health check timeout in milliseconds */
const HEALTH_CHECK_TIMEOUT_MS = 5000;

/**
 * Verify Warden authz service is healthy before starting.
 * Fails startup if authz is enabled but Warden is unavailable.
 */
async function verifyWardenHealth(): Promise<void> {
  if (AUTHZ_ENABLED !== "true" || !AUTHZ_PROVIDER_URL) {
    // biome-ignore lint/suspicious/noConsole: startup logging
    console.log("[AuthZ] Disabled or not configured, skipping health check");
    return;
  }

  try {
    const response = await fetch(`${AUTHZ_PROVIDER_URL}/health`, {
      signal: AbortSignal.timeout(HEALTH_CHECK_TIMEOUT_MS),
    });

    if (!response.ok) {
      throw new Error(`Warden health check failed: ${response.status}`);
    }

    // biome-ignore lint/suspicious/noConsole: startup logging
    console.log("[AuthZ] Warden health check passed");
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unknown error during health check";
    console.error(`[AuthZ] Warden health check failed: ${message}`);
    throw new Error(`Warden unavailable: ${message}`);
  }
}

/**
 * Start the Elysia server with preflight checks.
 */
async function startServer(): Promise<void> {
  // Preflight: verify external dependencies
  await verifyWardenHealth();

  /**
   * Elysia server.
   */
  const app = new Elysia({
    ...(isDevEnv && {
      serve: {
        // https://elysiajs.com/patterns/configuration#serve-tls
        // https://bun.sh/guides/http/tls
        // NB: Elysia (and Bun) trust the well-known CA list curated by Mozilla (https://wiki.mozilla.org/CA/Included_Certificates), but they can be customized here if needed (`tls.ca` option)
        tls: {
          certFile: "cert.pem",
          keyFile: "key.pem",
        },
      },
    }),
  })
    .use(
      cors({
        origin: CORS_ALLOWED_ORIGINS!.split(","),
        methods: ["GET", "POST", "OPTIONS"],
      }),
    )
    .use(entitlementsWebhook)
    .use(
      yoga({
        schema,
        context: createGraphqlContext,
        graphiql: isDevEnv,
        plugins: [
          ...armorPlugin,
          authenticationPlugin,
          // disable GraphQL schema introspection in production to mitigate reverse engineering
          isProdEnv && useDisableIntrospection(),
          isProdEnv &&
            useOpenTelemetry({
              variables: true,
              result: true,
            }),
          // parser and validation caches recommended for Grafast (https://grafast.org/grafast/servers#envelop)
          useParserCache(),
          useValidationCache(),
          useGrafast(),
        ],
      }),
    )
    .listen(PORT);

  // biome-ignore lint/suspicious/noConsole: root logging
  console.log(
    `🦊 ${appConfig.name} Elysia server running at ${app.server?.url.toString().slice(0, -1)}`,
  );

  // biome-ignore lint/suspicious/noConsole: root logging
  console.log(
    `🧘 ${appConfig.name} GraphQL Yoga API running at ${app.server?.url}graphql`,
  );
}

// Start the server
startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
