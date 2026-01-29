/**
 * Shared Elysia/TypeBox schemas for AI message validation.
 *
 * These schemas are used across chat and project creation endpoints
 * to ensure consistent message format validation.
 */

import { t } from "elysia";

/**
 * Schema for ModelMessage validation.
 *
 * Allows user, assistant, and tool roles.
 * Content can be string, array (for multi-part), or null (tool-only messages).
 */
export const modelMessageSchema = t.Object(
  {
    role: t.Union([
      t.Literal("user"),
      t.Literal("assistant"),
      t.Literal("tool"),
    ]),
    // TanStack AI sends `null` for tool-only messages (e.g., after approval)
    content: t.Union([t.String(), t.Array(t.Any()), t.Null()]),
    toolCallId: t.Optional(t.String()),
  },
  { additionalProperties: true },
);

/**
 * Schema for approval responses sent separately from messages.
 *
 * The client sends these to indicate user approval/denial of tool calls.
 */
export const approvalResponseSchema = t.Object({
  id: t.String(),
  approved: t.Boolean(),
});

/**
 * Type for approval response.
 */
export type ApprovalResponse = {
  id: string;
  approved: boolean;
};
