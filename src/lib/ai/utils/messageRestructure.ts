/**
 * Utility for restructuring messages to ensure valid conversation format.
 *
 * After approval continuation flow, tool results can end up in the wrong position
 * (after intervening assistant messages). This utility fixes the ordering.
 *
 * @knipignore - Internal utilities exported for testing and direct use
 */

import { CONTINUATION_MARKER } from "../constants";

import type { ModelMessage } from "@tanstack/ai";

/**
 * Restructures messages to ensure valid conversation format.
 *
 * After approval continuation flow, tool results can end up in the wrong position
 * (after intervening assistant messages). This function:
 * 1. Collects all tool results
 * 2. Matches them to their corresponding tool calls
 * 3. Places tool results immediately after the assistant message with the tool call
 * 4. Removes orphaned tool results that would break the conversation structure
 *
 * Valid structure: assistant(tool_calls) → tool(results) → assistant(text) → user
 * Invalid structure: assistant(tool_calls) → tool(partial) → assistant(text) → tool(orphaned)
 *
 * @param messages - Raw messages array
 * @returns Restructured messages with proper tool result placement
 */
export function restructureMessages(messages: ModelMessage[]): ModelMessage[] {
  // First pass: collect all tool results by their toolCallId
  const toolResultsByCallId = new Map<string, ModelMessage>();
  for (const msg of messages) {
    if (msg.role === "tool" && msg.toolCallId) {
      toolResultsByCallId.set(msg.toolCallId, msg);
    }
  }

  // Second pass: build restructured message list
  const result: ModelMessage[] = [];
  const usedToolCallIds = new Set<string>();

  for (const msg of messages) {
    // Skip tool messages - we'll insert them after their corresponding assistant message
    if (msg.role === "tool") {
      continue;
    }

    result.push(msg);

    // After an assistant message with tool calls, insert all matching tool results
    if (msg.role === "assistant") {
      const toolCalls = (msg as { toolCalls?: Array<{ id: string }> })
        .toolCalls;
      if (toolCalls && toolCalls.length > 0) {
        for (const tc of toolCalls) {
          const toolResult = toolResultsByCallId.get(tc.id);
          if (toolResult && !usedToolCallIds.has(tc.id)) {
            result.push(toolResult);
            usedToolCallIds.add(tc.id);
          }
        }
      }
    }
  }

  return result;
}

/**
 * Filter messages to remove system messages and continuation markers.
 *
 * Defense-in-depth: TypeBox schema already excludes system role,
 * but runtime payloads could still contain it if validation is bypassed.
 *
 * @param messages - Raw messages from client
 * @returns Filtered messages safe for processing
 */
export function filterClientMessages(messages: ModelMessage[]): ModelMessage[] {
  return messages.filter(
    (m) =>
      (m.role as string) !== "system" &&
      !(m.role === "user" && m.content === CONTINUATION_MARKER),
  );
}

/**
 * Prepare messages for AI processing.
 *
 * Combines filtering and restructuring into a single operation.
 *
 * @param messages - Raw messages from client
 * @returns Filtered and restructured messages
 */
export function prepareMessagesForAI(messages: ModelMessage[]): ModelMessage[] {
  const filtered = filterClientMessages(messages);
  return restructureMessages(filtered);
}
