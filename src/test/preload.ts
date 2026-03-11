/**
 * Test preload file.
 *
 * Mocks environment variables before any test file loads,
 * preventing side effects from real env.config.ts imports.
 */

import { mock } from "bun:test";

mock.module("lib/config/env.config", () => ({
  NODE_ENV: "test",
  PORT: 4000,
  HOST: "0.0.0.0",
  DATABASE_URL: "postgresql://test:test@localhost:5432/test",
  AUTH_SECRET: "test-secret",
  AUTH_BASE_URL: "http://localhost:4000",
  GITHUB_APP_ID: "12345",
  GITHUB_APP_PRIVATE_KEY:
    "-----BEGIN RSA PRIVATE KEY-----\ntest\n-----END RSA PRIVATE KEY-----",
  GITHUB_WEBHOOK_SECRET: "test-webhook-secret",
  SANDBOX_IMAGE: undefined,
  OPENROUTER_API_KEY: "test-openrouter-key",
  AGENT_ENABLED: "true",
  CORS_ALLOWED_ORIGINS: "http://localhost:3000",
  PROTECT_ROUTES: "false",
  AUTHZ_ENABLED: "false",
  AUTHZ_API_URL: undefined,
  SELF_HOSTED: "false",
  ENCRYPTION_SECRET: undefined,
  isDevEnv: false,
  isProdEnv: false,
  protectRoutes: false,
  isSelfHosted: false,
  isSearchEnabled: false,
}));
