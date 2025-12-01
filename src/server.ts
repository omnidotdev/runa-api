import { cors } from "@elysiajs/cors";
import { yoga } from "@elysiajs/graphql-yoga";
import { useOpenTelemetry } from "@envelop/opentelemetry";
import { useParserCache } from "@envelop/parser-cache";
import { useValidationCache } from "@envelop/validation-cache";
import { useDisableIntrospection } from "@graphql-yoga/plugin-disable-introspection";
import { Checkout, CustomerPortal, Webhooks } from "@polar-sh/elysia";
import { eq } from "drizzle-orm";
import { Elysia } from "elysia";
import { schema } from "generated/graphql/schema.executable";
import { useGrafast } from "grafast/envelop";

import appConfig from "lib/config/app.config";
import {
  CHECKOUT_SUCCESS_URL,
  CORS_ALLOWED_ORIGINS,
  POLAR_ACCESS_TOKEN,
  POLAR_WEBHOOK_SECRET,
  PORT,
  enablePolarSandbox,
  isDevEnv,
  isProdEnv,
} from "lib/config/env.config";
import { dbPool as db } from "lib/db/db";
import { workspaceTable } from "lib/db/schema";
import createGraphqlContext from "lib/graphql/createGraphqlContext";
import { armorPlugins, useAuth } from "lib/graphql/plugins";

import type { SelectWorkspace } from "lib/db/schema";

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
  .get(
    "/checkout",
    Checkout({
      accessToken: POLAR_ACCESS_TOKEN,
      successUrl: CHECKOUT_SUCCESS_URL,
      server: enablePolarSandbox ? "sandbox" : "production",
    }),
  )
  .get(
    "/portal",
    CustomerPortal({
      accessToken: POLAR_ACCESS_TOKEN,
      server: enablePolarSandbox ? "sandbox" : "production",
      getCustomerId: async (req) => {
        const { searchParams } = new URL(req.url);
        return searchParams.get("customerId")!;
      },
    }),
  )
  .post(
    "/polar/webhooks",
    Webhooks({
      webhookSecret: POLAR_WEBHOOK_SECRET!,
      onSubscriptionCreated: async (payload) => {
        // TODO: determine if we need to conditionalize this to runa specific subscriptions (probably do)
        const workspaceId = payload.data.metadata.workspaceId;

        if (!workspaceId) return;

        await db
          .update(workspaceTable)
          .set({ subscriptionId: payload.data.id })
          .where(eq(workspaceTable.id, workspaceId as string));
      },
      onSubscriptionUpdated: async (payload) => {
        // TODO: determine if we need to conditionalize this to runa specific subscriptions (probably do)
        const workspaceId = payload.data.metadata.workspaceId;

        if (payload.data.status === "active") {
          const tier = payload.data.product.metadata
            .title as SelectWorkspace["tier"];

          await db
            .update(workspaceTable)
            .set({ tier })
            .where(eq(workspaceTable.id, workspaceId as string));
        }
      },
    }),
  )
  .use(
    yoga({
      schema,
      context: createGraphqlContext,
      plugins: [
        ...armorPlugins,
        useAuth(),
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
