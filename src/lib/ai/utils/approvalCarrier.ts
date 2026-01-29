/**
 * Utility for creating approval carrier messages.
 *
 * TanStack AI's collectClientState looks for approval info in UIMessage format
 * (with .parts array), but the client sends ModelMessage format. This utility
 * creates synthetic messages to carry approval state between formats.
 *
 * NOTE: This is a workaround for TanStack AI not serializing approval state
 * in ModelMessages. Consider reporting upstream: https://github.com/TanStack/ai
 */

import { APPROVAL_ID_PREFIX } from "../constants";

import type { ApprovalResponse } from "../schemas/message.schema";

/**
 * Synthetic message format that carries approval state.
 *
 * This is a hybrid format:
 * - Has `role: "assistant"` like ModelMessage
 * - Has `parts` array like UIMessage (for collectClientState to find approvals)
 */
export interface ApprovalCarrierMessage {
  role: "assistant";
  parts: Array<{
    type: "tool-call";
    id: string;
    state: "approval-responded";
    approval: {
      id: string;
      approved: boolean;
    };
  }>;
}

/**
 * Convert approval responses from the client into a synthetic message
 * that TanStack AI's collectClientState can parse.
 *
 * TanStack AI generates approval IDs in the format "approval_${toolCallId}".
 * We extract the tool call ID for the carrier message but keep the full
 * approval ID for the approval lookup.
 *
 * @param approvals - Array of approval responses from the client
 * @returns Synthetic message with approval state
 */
export function createApprovalCarrierMessage(
  approvals: ApprovalResponse[],
): ApprovalCarrierMessage {
  return {
    role: "assistant",
    parts: approvals.map((approval) => {
      // TanStack AI uses "approval_${toolCallId}" format
      const toolCallId = approval.id.startsWith(APPROVAL_ID_PREFIX)
        ? approval.id.slice(APPROVAL_ID_PREFIX.length)
        : approval.id;

      if (!approval.id.startsWith(APPROVAL_ID_PREFIX)) {
        console.warn("[AI] Approval ID has unexpected format:", approval.id);
      }

      return {
        type: "tool-call" as const,
        id: toolCallId,
        state: "approval-responded" as const,
        approval: {
          id: approval.id,
          approved: approval.approved,
        },
      };
    }),
  };
}
