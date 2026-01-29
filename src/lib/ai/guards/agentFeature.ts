/**
 * Elysia guard that checks if the agent feature flag is enabled.
 *
 * This guard should be applied first in the guard chain since it's
 * the cheapest check and prevents unnecessary authentication attempts
 * when the feature is disabled.
 */

import { Elysia } from "elysia";

import { isAgentEnabled } from "lib/flags";

/**
 * Guard that verifies the agent feature is enabled.
 * Returns 403 if the feature flag is disabled.
 */
export const agentFeatureGuard = new Elysia({
  name: "guard:agentFeature",
}).derive({ as: "scoped" }, async ({ set }) => {
  const enabled = await isAgentEnabled();

  if (!enabled) {
    set.status = 403;
    throw new Error("Agent feature is not enabled");
  }

  return {};
});
