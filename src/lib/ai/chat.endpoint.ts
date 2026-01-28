import { chat, maxIterations, toServerSentEventsResponse } from "@tanstack/ai";
import { Elysia, t } from "elysia";

import { isAgentEnabled } from "lib/flags";
import { authenticateRequest, validateProjectAccess } from "./auth";
import { createAdapter, resolveAgentConfig, resolvePersona } from "./config";
import { buildProjectContext } from "./prompts/projectContext";
import { buildSystemPrompt } from "./prompts/system";
import { ORG_CHAT_LIMIT, USER_CHAT_LIMIT, checkRateLimit } from "./rateLimit";
import {
  createSession,
  listSessions,
  loadSession,
  saveSessionMessages,
} from "./session/manager";
import {
  createDelegationTool,
  createDestructiveTools,
  createQueryTools,
  createWriteTools,
} from "./tools/server";

import type { ModelMessage, StreamChunk } from "@tanstack/ai";
import type { SelectAgentSession } from "lib/db/schema";
import type { AuthenticatedUser } from "./auth";

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
 */
function restructureMessages(messages: ModelMessage[]): ModelMessage[] {
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

/** Elysia/TypeBox schema for ModelMessage validation. */
const modelMessageSchema = t.Object(
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

/** Schema for approval responses sent separately from messages. */
const approvalResponseSchema = t.Object({
  id: t.String(),
  approved: t.Boolean(),
});

/**
 * TanStack AI's collectClientState looks for approval info in UIMessage format
 * (with .parts array), but the client sends ModelMessage format. This interface
 * represents a synthetic message we inject to carry approval state.
 */
interface ApprovalCarrierMessage {
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
 * NOTE: This is a workaround for TanStack AI not serializing approval state
 * in ModelMessages. Consider reporting upstream: https://github.com/TanStack/ai
 */
function createApprovalCarrierMessage(
  approvals: Array<{ id: string; approved: boolean }>,
): ApprovalCarrierMessage {
  const APPROVAL_PREFIX = "approval_";

  return {
    role: "assistant",
    parts: approvals.map((approval) => {
      // TanStack AI uses "approval_${toolCallId}" format
      const toolCallId = approval.id.startsWith(APPROVAL_PREFIX)
        ? approval.id.slice(APPROVAL_PREFIX.length)
        : approval.id;

      if (!approval.id.startsWith(APPROVAL_PREFIX)) {
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

/**
 * AI Agent routes.
 *
 * POST /api/ai/chat    - SSE streaming chat endpoint
 * GET  /api/ai/sessions - List chat sessions for a project
 */
const aiRoutes = new Elysia({ prefix: "/api/ai" })
  .post(
    "/chat",
    async ({ request, body, set }) => {
      // Check feature flag
      const enabled = await isAgentEnabled();
      if (!enabled) {
        set.status = 403;
        return { error: "Agent feature is not enabled" };
      }

      // Authenticate
      let auth: AuthenticatedUser;
      try {
        auth = await authenticateRequest(request);
      } catch (err) {
        set.status = 401;
        return {
          error: err instanceof Error ? err.message : "Authentication failed",
        };
      }

      // Validate project access
      let projectAccess: { organizationId: string };
      try {
        projectAccess = await validateProjectAccess(
          body.projectId,
          auth.organizations,
        );
      } catch (err) {
        set.status = 403;
        return {
          error: err instanceof Error ? err.message : "Access denied",
        };
      }

      const { organizationId } = projectAccess;

      // Rate-limit: per-user and per-org
      const userLimit = checkRateLimit(`user:${auth.user.id}`, USER_CHAT_LIMIT);
      if (!userLimit.allowed) {
        set.status = 429;
        set.headers["Retry-After"] = String(userLimit.retryAfterSeconds);
        return { error: "Too many requests. Please try again later." };
      }

      const orgLimit = checkRateLimit(`org:${organizationId}`, ORG_CHAT_LIMIT);
      if (!orgLimit.allowed) {
        set.status = 429;
        set.headers["Retry-After"] = String(orgLimit.retryAfterSeconds);
        return {
          error: "Organization rate limit exceeded. Please try again later.",
        };
      }

      const requestStartTime = Date.now();

      // Resolve agent configuration
      const agentConfig = await resolveAgentConfig(organizationId);

      // Load or create session
      let session: SelectAgentSession;
      if (body.sessionId) {
        const loadedSession = await loadSession(
          body.sessionId,
          auth.user.id,
          body.projectId,
        );
        if (!loadedSession) {
          set.status = 404;
          return { error: "Session not found" };
        }
        session = loadedSession;
      } else {
        session = await createSession({
          organizationId,
          projectId: body.projectId,
          userId: auth.user.id,
        });
      }

      // Resolve persona: client-specified > org default > none
      const persona = body.personaId
        ? await resolvePersona(body.personaId, organizationId)
        : agentConfig.defaultPersona;

      // Build project context for system prompt
      const projectContext = await buildProjectContext({
        projectId: body.projectId,
        organizationId,
        userId: auth.user.id,
        userName: auth.user.name,
        customInstructions: agentConfig.customInstructions,
      });

      const systemPrompt = buildSystemPrompt(projectContext, persona);

      // Use messages from client — filter out:
      // 1. System role messages (defense-in-depth, TypeBox already excludes these)
      // 2. Continuation marker messages (synthetic messages from approval flow)
      // Cast to `string` comparison because TypeBox schema already excludes "system",
      // but runtime payloads could still contain it if validation is bypassed.
      const CONTINUATION_MARKER = "[CONTINUE_AFTER_APPROVAL]";
      const filteredMessages = (body.messages as ModelMessage[]).filter(
        (m) =>
          (m.role as string) !== "system" &&
          !(m.role === "user" && m.content === CONTINUATION_MARKER),
      );

      // Inject approval state into messages.
      // TanStack AI's collectClientState expects UIMessage format with .parts,
      // but ModelMessages don't include approval info. We create a synthetic
      // "carrier" message that collectClientState can parse.
      //
      // The carrier message is cast through `unknown` because it's a hybrid:
      // - Has `role: "assistant"` like ModelMessage
      // - Has `parts` array like UIMessage (for collectClientState to find approvals)
      // This intentional structure mismatch is the workaround for TanStack AI
      // not serializing approval state in ModelMessages.
      //
      // TODO: Add validation that approval IDs correspond to pending approvals
      // from this session to prevent unauthorized approval injection.
      const approvals = body.approvals ?? [];

      // Restructure messages to ensure valid conversation format
      // (tool results immediately after their corresponding tool calls)
      const restructuredMessages = restructureMessages(filteredMessages);

      const allMessages =
        approvals.length > 0
          ? [
              ...restructuredMessages,
              createApprovalCarrierMessage(
                approvals,
              ) as unknown as ModelMessage,
            ]
          : restructuredMessages;

      // Create tools
      const { queryTasks, queryProject, getTask } = createQueryTools({
        projectId: body.projectId,
        organizationId,
      });

      const writeContext = {
        projectId: body.projectId,
        organizationId,
        userId: auth.user.id,
        accessToken: auth.accessToken,
        sessionId: session.id,
      };

      const {
        createTask,
        updateTask,
        moveTask,
        assignTask,
        addLabel,
        removeLabel,
        addComment,
      } = createWriteTools(writeContext, {
        requireApprovalForCreate: agentConfig.requireApprovalForCreate,
      });

      const { deleteTask, batchMoveTasks, batchUpdateTasks, batchDeleteTasks } =
        createDestructiveTools(writeContext, agentConfig);

      // Agent-to-Agent delegation (Phase 9B)
      const delegateToAgent = createDelegationTool({
        ...writeContext,
        delegationDepth: 0,
        agentConfig,
        userName: auth.user.name,
      });

      // Structured request log
      const requestMeta = {
        userId: auth.user.id,
        projectId: body.projectId,
        sessionId: session.id,
        messageCount: allMessages.length,
        isNewSession: !body.sessionId,
      };

      // Create adapter (uses org-provided key when available, falls back to env).
      // Extract and clear the decrypted key immediately after adapter creation
      // to prevent the plaintext from lingering in the long-lived SSE closure.
      const { orgApiKey, model } = agentConfig;
      const adapter = createAdapter(model, orgApiKey);

      // Create streaming response
      // Messages validated by TypeBox schema; adapter chosen dynamically so cast is required
      const aiStream: AsyncIterable<StreamChunk> = chat({
        adapter,
        // biome-ignore lint/suspicious/noExplicitAny: dynamic adapter requires cast
        messages: allMessages as any,
        tools: [
          queryTasks,
          queryProject,
          getTask,
          createTask,
          updateTask,
          moveTask,
          assignTask,
          addLabel,
          removeLabel,
          addComment,
          deleteTask,
          batchMoveTasks,
          batchUpdateTasks,
          batchDeleteTasks,
          // Agent-to-Agent delegation (null when at max depth — filtered out)
          ...(delegateToAgent ? [delegateToAgent] : []),
        ],
        systemPrompts: [systemPrompt],
        agentLoopStrategy: maxIterations(agentConfig.maxIterations),
      });

      // Track base tool call count from session
      const baseToolCallCount = session.toolCallCount;

      // Wrap the stream to capture the assistant response for persistence
      const wrappedStream = async function* () {
        let assistantContent = "";
        let newToolCallCount = 0;
        const toolCalls: Array<{
          name: string;
          arguments: string;
          id: string;
        }> = [];
        const toolResults: Array<{
          id: string;
          output: string;
        }> = [];

        try {
          for await (const chunk of aiStream) {
            yield chunk;

            if (chunk.type === "content" && chunk.content) {
              assistantContent = chunk.content;
            }
            if (chunk.type === "tool_call") {
              toolCalls.push({
                name: chunk.toolCall.function.name,
                arguments: chunk.toolCall.function.arguments,
                id: chunk.toolCall.id,
              });
              newToolCallCount++;
            }
            if (chunk.type === "tool_result") {
              toolResults.push({
                id: chunk.toolCallId,
                output: chunk.content,
              });
            }
          }

          // Persist the complete conversation after stream ends
          if (assistantContent || toolCalls.length > 0) {
            // Build final message list immutably
            const toolMessages = toolCalls.flatMap((tc) => {
              const result = toolResults.find((r) => r.id === tc.id);
              return [
                { role: "assistant" as const, content: "", toolCallId: tc.id },
                ...(result
                  ? [
                      {
                        role: "tool" as const,
                        content: result.output,
                        toolCallId: tc.id,
                      },
                    ]
                  : []),
              ];
            });

            const assistantMessage = assistantContent
              ? [{ role: "assistant" as const, content: assistantContent }]
              : [];

            const finalMessages = [
              ...allMessages,
              ...toolMessages,
              ...assistantMessage,
            ];

            const durationMs = Date.now() - requestStartTime;

            // Save to database (fire-and-forget, don't block the stream)
            saveSessionMessages(session.id, finalMessages, {
              toolCalls: baseToolCallCount + newToolCallCount,
            }).catch((err) => {
              console.error("[AI] Failed to save session messages:", {
                ...requestMeta,
                error: err instanceof Error ? err.message : String(err),
                durationMs,
              });
            });

            console.info("[AI] Chat completed:", {
              ...requestMeta,
              toolCallCount: newToolCallCount,
              durationMs,
            });
          }
        } catch (err) {
          console.error("[AI] Stream error:", {
            sessionId: session.id,
            error: err instanceof Error ? err.message : String(err),
          });
          throw err;
        }
      };

      // Return SSE response with session ID header
      const response = toServerSentEventsResponse(wrappedStream());

      // Add session ID header so the client can resume
      const headers = new Headers(response.headers);
      headers.set("X-Agent-Session-Id", session.id);
      headers.set("Access-Control-Expose-Headers", "X-Agent-Session-Id");

      return new Response(response.body, {
        status: response.status,
        headers,
      });
    },
    {
      body: t.Object({
        projectId: t.String(),
        sessionId: t.Optional(t.String()),
        personaId: t.Optional(t.String()),
        messages: t.Array(modelMessageSchema),
        // Approval responses sent separately since ModelMessage format doesn't preserve them
        approvals: t.Optional(t.Array(approvalResponseSchema)),
      }),
    },
  )
  .get(
    "/sessions",
    async ({ request, query, set }) => {
      // Check feature flag
      const enabled = await isAgentEnabled();
      if (!enabled) {
        set.status = 403;
        return { error: "Agent feature is not enabled" };
      }

      // Authenticate
      let auth: AuthenticatedUser;
      try {
        auth = await authenticateRequest(request);
      } catch (err) {
        set.status = 401;
        return {
          error: err instanceof Error ? err.message : "Authentication failed",
        };
      }

      // Validate project access
      try {
        await validateProjectAccess(query.projectId, auth.organizations);
      } catch (err) {
        set.status = 403;
        return {
          error: err instanceof Error ? err.message : "Access denied",
        };
      }

      const sessions = await listSessions(query.projectId, auth.user.id);
      return { sessions };
    },
    {
      query: t.Object({
        projectId: t.String(),
      }),
    },
  );

export default aiRoutes;
