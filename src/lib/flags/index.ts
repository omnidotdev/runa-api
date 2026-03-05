import { AGENT_ENABLED } from "lib/config/env.config";
import { flags } from "lib/providers";

/** @knipignore */
export const FLAGS = {
  MAINTENANCE: "runa-api-maintenance-mode",
  AGENT_ENABLED: "runa-agent-enabled",
  AGENT_CHAT_PANEL: "runa-agent-chat-panel",
} as const;

/**
 * Check if maintenance mode is enabled.
 * @knipignore
 */
export const isMaintenanceMode = async (): Promise<boolean> => {
  return flags.isEnabled(FLAGS.MAINTENANCE);
};

/**
 * Check if the AI agent feature is enabled.
 *
 * Supports env var override (AGENT_ENABLED=true) for local development
 * without Unleash. In production, use the feature flag.
 */
export const isAgentEnabled = async (): Promise<boolean> => {
  // Allow env var override for local development
  if (AGENT_ENABLED === "true") return true;
  return flags.isEnabled(FLAGS.AGENT_ENABLED);
};
