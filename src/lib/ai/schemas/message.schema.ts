/** Shared Elysia/TypeBox schemas for AI message validation. */

import { t } from "elysia";

/** Schema for CoreMessage validation. Allows user, assistant, and tool roles. */
export const modelMessageSchema = t.Object(
  {
    role: t.Union([
      t.Literal("user"),
      t.Literal("assistant"),
      t.Literal("tool"),
    ]),
    content: t.Union([t.String(), t.Array(t.Any()), t.Null()]),
    toolCallId: t.Optional(t.String()),
  },
  { additionalProperties: true },
);
