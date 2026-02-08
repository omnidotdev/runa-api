import { cors } from "@elysiajs/cors";
import { yoga } from "@elysiajs/graphql-yoga";
import { useOpenTelemetry } from "@envelop/opentelemetry";
import { useParserCache } from "@envelop/parser-cache";
import { useValidationCache } from "@envelop/validation-cache";
import { useDisableIntrospection } from "@graphql-yoga/plugin-disable-introspection";
import { Elysia } from "elysia";
import { rateLimit } from "elysia-rate-limit";
import { schema } from "generated/graphql/schema.executable";
import { useGrafast } from "grafast/envelop";

import authzRoutes from "lib/authz/routes";
import appConfig from "lib/config/app.config";
import {
  AUTHZ_API_URL,
  AUTHZ_ENABLED,
  AUTH_SECRET,
  BUILD_VERSION,
  CORS_ALLOWED_ORIGINS,
  DATABASE_URL,
  PORT,
  isDevEnv,
  isProdEnv,
  isSelfHosted,
} from "lib/config/env.config";
import { pgPool } from "lib/db/db";
import entitlementsWebhook from "lib/entitlements/webhooks";
import createGraphqlContext from "lib/graphql/createGraphqlContext";
import {
  armorPlugin,
  authenticationPlugin,
  organizationsPlugin,
} from "lib/graphql/plugins";
import idpWebhook from "lib/idp/webhooks";
import { maintenanceMiddleware } from "lib/middleware/maintenance";

/** Health check timeout in milliseconds */
const HEALTH_CHECK_TIMEOUT_MS = 5000;

/**
 * Verify required environment variables are set.
 * Fails startup if critical configuration is missing.
 */
function verifyEnvConfig(): void {
  if (!DATABASE_URL) {
    throw new Error("DATABASE_URL is required");
  }

  if (isSelfHosted && !AUTH_SECRET) {
    throw new Error("AUTH_SECRET is required for self-hosted mode");
  }

  // Validate AUTH_SECRET strength (minimum 32 bytes for HKDF-SHA256 security)
  if (AUTH_SECRET && AUTH_SECRET.length < 32) {
    throw new Error(
      "AUTH_SECRET must be at least 32 characters. Generate one with: openssl rand -base64 48",
    );
  }

  // biome-ignore lint/suspicious/noConsole: startup logging
  console.log("[Config] Environment variables verified");
}

/**
 * Verify database connectivity before starting.
 * Fails startup if the database is unreachable.
 */
async function verifyDatabaseHealth(): Promise<void> {
  try {
    const client = await pgPool.connect();

    try {
      await client.query("SELECT 1");
    } finally {
      client.release();
    }

    // biome-ignore lint/suspicious/noConsole: startup logging
    console.log("[Database] Connection verified");
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown database error";
    throw new Error(`Database unavailable: ${message}`);
  }
}

/**
 * Check database health for readiness probe.
 */
async function checkDatabaseHealth(): Promise<boolean> {
  try {
    const client = await pgPool.connect();

    try {
      await client.query("SELECT 1");
      return true;
    } finally {
      client.release();
    }
  } catch {
    return false;
  }
}

/**
 * Verify PDP (authorization service) is healthy before starting.
 * Fails startup if authz is enabled but PDP is unavailable.
 */
async function verifyPdpHealth(): Promise<void> {
  if (AUTHZ_ENABLED !== "true" || !AUTHZ_API_URL) {
    // biome-ignore lint/suspicious/noConsole: startup logging
    console.log("[AuthZ] Disabled or not configured, skipping health check");
    return;
  }

  try {
    const response = await fetch(`${AUTHZ_API_URL}/health`, {
      signal: AbortSignal.timeout(HEALTH_CHECK_TIMEOUT_MS),
    });

    if (!response.ok) {
      throw new Error(`PDP health check failed: ${response.status}`);
    }

    // biome-ignore lint/suspicious/noConsole: startup logging
    console.log("[AuthZ] PDP health check passed");
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unknown error during health check";
    console.error(`[AuthZ] PDP health check failed: ${message}`);
    throw new Error(`PDP unavailable: ${message}`);
  }
}

/**
 * Start the Elysia server with preflight checks.
 */
async function startServer(): Promise<void> {
  // Preflight: verify configuration and dependencies
  verifyEnvConfig();
  await verifyDatabaseHealth();
  await verifyPdpHealth();

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
    .onAfterHandle(({ set }) => {
      set.headers["X-Content-Type-Options"] = "nosniff";
      set.headers["X-Frame-Options"] = "DENY";
      set.headers["X-XSS-Protection"] = "1; mode=block";
      set.headers["Referrer-Policy"] = "strict-origin-when-cross-origin";
    })
    .use(
      rateLimit({
        max: 100,
        duration: 60_000,
      }),
    )
    .use(maintenanceMiddleware)
    .use(
      cors({
        origin: CORS_ALLOWED_ORIGINS!.split(","),
        methods: ["GET", "POST", "OPTIONS"],
      }),
    )
    .use(authzRoutes)
    .use(entitlementsWebhook)
    .use(idpWebhook)
    .use(
      yoga({
        schema,
        context: createGraphqlContext,
        graphiql: isDevEnv,
        plugins: [
          ...armorPlugin,
          authenticationPlugin,
          organizationsPlugin,
          // disable GraphQL schema introspection in production to mitigate reverse engineering
          isProdEnv && useDisableIntrospection(),
          isProdEnv &&
            useOpenTelemetry({
              variables: true,
              result: false, // Disable full result logging to reduce serialization overhead
            }),
          // parser and validation caches recommended for Grafast (https://grafast.org/grafast/servers#envelop)
          useParserCache(),
          useValidationCache(),
          useGrafast(),
        ],
      }),
    )
    // Health check endpoints for container orchestration
    .get("/health", () => ({ status: "ok" }))
    .get("/ready", async ({ set }) => {
      const dbHealthy = await checkDatabaseHealth();

      if (!dbHealthy) {
        set.status = 503;
        return { status: "unavailable", database: false };
      }

      return { status: "ok", database: true };
    })
    .get("/version", () => ({
      name: "@omnidotdev/runa-api",
      version: BUILD_VERSION || "0.1.0",
      mode: isSelfHosted ? "self-hosted" : "saas",
    }))
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
