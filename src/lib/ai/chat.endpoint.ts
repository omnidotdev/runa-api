import { chat, maxIterations, toServerSentEventsResponse } from "@tanstack/ai";
import { Elysia, t } from "elysia";

import { isAgentEnabled } from "lib/flags";

import { authenticateRequest, validateProjectAccess } from "./auth";
import { createAdapter, resolveAgentConfig, resolvePersona } from "./config";
import { buildProjectContext } from "./prompts/projectContext";
import { buildSystemPrompt } from "./prompts/system";
import {
  checkRateLimit,
  ORG_CHAT_LIMIT,
  USER_CHAT_LIMIT,
} from "./rateLimit";
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

/** Elysia/TypeBox schema for ModelMessage validation. */
const modelMessageSchema = t.Object(
  {
    role: t.Union([
      t.Literal("user"),
      t.Literal("assistant"),
      t.Literal("tool"),
    ]),
    content: t.Union([t.String(), t.Array(t.Any())]),
    toolCallId: t.Optional(t.String()),
  },
  { additionalProperties: true },
);

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
      let auth;
      try {
        auth = await authenticateRequest(request);
      } catch (err) {
        set.status = 401;
        return {
          error:
            err instanceof Error ? err.message : "Authentication failed",
        };
      }

      // Validate project access
      let projectAccess;
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
      const userLimit = checkRateLimit(
        `user:${auth.user.id}`,
        USER_CHAT_LIMIT,
      );
      if (!userLimit.allowed) {
        set.status = 429;
        set.headers["Retry-After"] = String(userLimit.retryAfterSeconds);
        return { error: "Too many requests. Please try again later." };
      }

      const orgLimit = checkRateLimit(`org:${organizationId}`, ORG_CHAT_LIMIT);
      if (!orgLimit.allowed) {
        set.status = 429;
        set.headers["Retry-After"] = String(orgLimit.retryAfterSeconds);
        return { error: "Organization rate limit exceeded. Please try again later." };
      }

      const requestStartTime = Date.now();

      // Resolve agent configuration
      const agentConfig = await resolveAgentConfig(organizationId);

      // Load or create session
      let session;
      if (body.sessionId) {
        session = await loadSession(
          body.sessionId,
          auth.user.id,
          body.projectId,
        );
        if (!session) {
          set.status = 404;
          return { error: "Session not found" };
        }
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

      // Use messages from client — filter out any system role as defense-in-depth.
      // Cast to `string` comparison because TypeBox schema already excludes "system",
      // but runtime payloads could still contain it if validation is bypassed.
      const allMessages = (body.messages as ModelMessage[]).filter(
        (m) => (m.role as string) !== "system",
      );

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

      const {
        deleteTask,
        batchMoveTasks,
        batchUpdateTasks,
        batchDeleteTasks,
      } = createDestructiveTools(writeContext, agentConfig);

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
      const { orgApiKey, ...safeConfig } = agentConfig;
      const adapter = createAdapter(
        safeConfig.provider,
        safeConfig.model,
        orgApiKey,
      );

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
            // biome-ignore lint/suspicious/noConsole: fire-and-forget persistence error logging
            console.error("[AI] Failed to save session messages:", {
              ...requestMeta,
              error: err instanceof Error ? err.message : String(err),
              durationMs,
            });
          });

          // biome-ignore lint/suspicious/noConsole: structured request metrics
          console.info("[AI] Chat completed:", {
            ...requestMeta,
            toolCallCount: newToolCallCount,
            durationMs,
          });
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
      let auth;
      try {
        auth = await authenticateRequest(request);
      } catch (err) {
        set.status = 401;
        return {
          error:
            err instanceof Error ? err.message : "Authentication failed",
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
