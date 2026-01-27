import { isEnabled } from "./client";

/** @knipignore */
export const FLAGS = {
  MAINTENANCE: "runa-api-maintenance-mode",
  AGENT_ENABLED: "runa-agent-enabled",
  AGENT_CHAT_PANEL: "runa-agent-chat-panel",
} as const;

/**
 * Check if maintenance mode is enabled.
 */
export const isMaintenanceMode = async (): Promise<boolean> => {
  return isEnabled(FLAGS.MAINTENANCE, false);
};

/**
 * Check if the AI agent feature is enabled.
 */
export const isAgentEnabled = async (): Promise<boolean> => {
  return isEnabled(FLAGS.AGENT_ENABLED, false);
};

/**
 * Check if the agent chat panel is enabled.
 */
export const isAgentChatPanelEnabled = async (): Promise<boolean> => {
  return isEnabled(FLAGS.AGENT_CHAT_PANEL, false);
};
