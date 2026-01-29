/**
 * AI Agent chat endpoint using Vercel AI SDK.
 *
 * POST /api/ai/chat    - SSE streaming chat endpoint
 * GET  /api/ai/sessions - List chat sessions for a project
 */

import { stepCountIs, streamText } from "ai";
import { Elysia, t } from "elysia";

import { checkProjectAccess } from "./auth";
import { resolveAgentConfig, resolvePersona } from "./config";
import { agentFeatureGuard, authGuard } from "./guards";
import { buildProjectContext } from "./prompts/projectContext";
import { buildSystemPrompt } from "./prompts/system";
import { createOpenRouterModel } from "./provider";
import { ORG_CHAT_LIMIT, USER_CHAT_LIMIT, checkRateLimit } from "./rateLimit";
import { modelMessageSchema } from "./schemas";
import {
  createSession,
  listSessions,
  loadSession,
  saveSessionMessages,
} from "./session/manager";
import { buildChatTools } from "./tools";

import type { ModelMessage } from "ai";
import type { SelectAgentSession } from "lib/db/schema";
import type { DelegationContext, WriteToolContext } from "./tools";

/**
 * AI Agent routes.
 *
 * POST /api/ai/chat    - SSE streaming chat endpoint
 * GET  /api/ai/sessions - List chat sessions for a project
 */
const aiRoutes = new Elysia({ prefix: "/api/ai" })
  .use(agentFeatureGuard)
  .use(authGuard)
  .post(
    "/chat",
    async ({ body, auth, set }) => {
      // Validate project access
      const accessCheck = await checkProjectAccess(
        body.projectId,
        auth.organizations,
      );
      if (!accessCheck.ok) {
        set.status = accessCheck.status;
        return accessCheck.response;
      }

      const { organizationId } = accessCheck.value;

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

      // Tool context for write operations
      const toolContext: WriteToolContext = {
        projectId: body.projectId,
        organizationId,
        userId: auth.user.id,
        accessToken: auth.accessToken,
        sessionId: session.id,
      };

      // Delegation context for persona delegation
      const delegationContext: DelegationContext = {
        ...toolContext,
        delegationDepth: 0,
        agentConfig,
        userName: auth.user.name,
      };

      // Build all tools using the preset
      const aiTools = buildChatTools(
        toolContext,
        {
          requireApprovalForCreate: agentConfig.requireApprovalForCreate,
          requireApprovalForDestructive:
            agentConfig.requireApprovalForDestructive,
        },
        delegationContext,
      );

      // Create model instance
      const model = createOpenRouterModel(
        agentConfig.model,
        agentConfig.orgApiKey,
      );

      // Convert messages to ModelMessage format
      const messages: ModelMessage[] = (body.messages as ModelMessage[]).filter(
        (m) => (m.role as string) !== "system",
      );

      // Structured request log
      const requestMeta = {
        userId: auth.user.id,
        projectId: body.projectId,
        sessionId: session.id,
        messageCount: messages.length,
        isNewSession: !body.sessionId,
      };

      // Track for persistence
      const baseToolCallCount = session.toolCallCount;

      // Create streaming response with Vercel AI SDK
      const result = streamText({
        model,
        messages,
        tools: aiTools,
        system: systemPrompt,
        stopWhen: stepCountIs(agentConfig.maxIterations),
        onFinish: async (finalResult) => {
          const durationMs = Date.now() - requestStartTime;
          const newToolCallCount = finalResult.toolCalls?.length ?? 0;

          // Build messages for persistence
          const finalMessages = [...messages, ...finalResult.response.messages];

          await saveSessionMessages(session.id, finalMessages, {
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
        },
      });

      // Create response with custom headers
      const response = result.toUIMessageStreamResponse();

      // Add session ID header
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
    async ({ query, auth, set }) => {
      // Validate project access
      const accessCheck = await checkProjectAccess(
        query.projectId,
        auth.organizations,
      );
      if (!accessCheck.ok) {
        set.status = accessCheck.status;
        return accessCheck.response;
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
