import type { KnipConfig } from "knip";

/**
 * Knip configuration.
 * @see https://knip.dev/overview/configuration
 */
const knipConfig: KnipConfig = {
  ignore: [
    "**/generated/**",
    "src/lib/config/drizzle.config.ts",
    "src/scripts/**",
    "src/jobs/**",
    "src/lib/db/db.ts",
    "src/lib/config/env.config.ts",
    // Instrumentation loaded via --import flag at runtime
    "src/instrumentation.ts",
    // Drizzle schema exports (relations, Select/Insert types) for ORM use
    "src/lib/db/schema/**",
    // AI constants exported for consistent reference across endpoints
    "src/lib/ai/constants.ts",
    // AI utility internals (high-level API is used via barrel export)
    "src/lib/ai/utils/messageRestructure.ts",
    // Rollback types exported for module consumers
    "src/lib/ai/rollback/index.ts",
  ],
  ignoreDependencies: [
    // OpenTelemetry deps used by instrumentation.ts (loaded via --import)
    "@opentelemetry/auto-instrumentations-node",
    "@opentelemetry/exporter-logs-otlp-http",
    "@opentelemetry/exporter-trace-otlp-http",
    "@opentelemetry/resources",
    "@opentelemetry/sdk-logs",
    "@opentelemetry/sdk-node",
    "@opentelemetry/semantic-conventions",
    "@dataplan/pg",
  ],
  tags: ["-knipignore"],
};

export default knipConfig;
