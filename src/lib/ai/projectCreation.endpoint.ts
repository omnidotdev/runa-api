/**
 * Project Creation AI endpoint.
 *
 * POST /api/ai/project-creation/chat - SSE streaming chat for project creation
 *
 * This endpoint operates at the organization level (not project level)
 * since the project doesn't exist yet. It uses a specialized system prompt
 * focused on discovery and planning before project creation.
 */

import { chat, maxIterations, toServerSentEventsResponse } from "@tanstack/ai";
import { and, eq } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { dbPool } from "lib/db/db";
import { agentSessions, projects } from "lib/db/schema";
import { isAgentEnabled } from "lib/flags";
import { authenticateRequest, validateOrganizationAccess } from "./auth";
import { createAdapter, resolveAgentConfig } from "./config";
import { buildProjectCreationPrompt } from "./prompts/projectCreation";
import { ORG_CHAT_LIMIT, USER_CHAT_LIMIT, checkRateLimit } from "./rateLimit";
import {
  createCreationSession,
  loadCreationSession,
  saveSessionMessages,
} from "./session/manager";
import { createProjectCreationTools } from "./tools/server/projectCreation.tools";

import type { ModelMessage, StreamChunk } from "@tanstack/ai";
import type { SelectAgentSession } from "lib/db/schema";
import type { AuthenticatedUser } from "./auth";

/** Elysia/TypeBox schema for ModelMessage validation. */
const modelMessageSchema = t.Object(
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

/** Schema for approval responses sent separately from messages. */
const approvalResponseSchema = t.Object({
  id: t.String(),
  approved: t.Boolean(),
});

/**
 * Approval carrier message for TanStack AI.
 * @see chat.endpoint.ts for detailed explanation
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
 * Create approval carrier message for TanStack AI.
 */
function createApprovalCarrierMessage(
  approvals: Array<{ id: string; approved: boolean }>,
): ApprovalCarrierMessage {
  const APPROVAL_PREFIX = "approval_";

  return {
    role: "assistant",
    parts: approvals.map((approval) => {
      const toolCallId = approval.id.startsWith(APPROVAL_PREFIX)
        ? approval.id.slice(APPROVAL_PREFIX.length)
        : approval.id;

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
 * Project Creation AI routes.
 *
 * POST /api/ai/project-creation/chat - Create projects via conversational AI
 */
const projectCreationRoutes = new Elysia({
  prefix: "/api/ai/project-creation",
}).post(
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

    // Validate organization access (requires editor/admin/owner role)
    let orgAccess: {
      organizationId: string;
      organizationSlug: string;
      roles: string[];
    };
    try {
      orgAccess = await validateOrganizationAccess(
        body.organizationId,
        auth.organizations,
      );
    } catch (err) {
      set.status = 403;
      return {
        error: err instanceof Error ? err.message : "Access denied",
      };
    }

    const { organizationId, organizationSlug } = orgAccess;

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
      // First try loading as a creation session (projectId IS NULL)
      let loadedSession: SelectAgentSession | null = await loadCreationSession(
        body.sessionId,
        auth.user.id,
        organizationId,
      );

      // If not found, the session may have been linked to a project after creation.
      // Query directly to allow follow-up messages after successful project creation.
      if (!loadedSession) {
        const linkedSession = await dbPool.query.agentSessions.findFirst({
          where: and(
            eq(agentSessions.id, body.sessionId),
            eq(agentSessions.userId, auth.user.id),
            eq(agentSessions.organizationId, organizationId),
          ),
        });
        loadedSession = linkedSession ?? null;
      }

      if (!loadedSession) {
        set.status = 404;
        return { error: "Session not found" };
      }
      session = loadedSession;
    } else {
      session = await createCreationSession({
        organizationId,
        userId: auth.user.id,
        title: "New Project",
      });
    }

    // Get existing project names and prefixes for collision detection
    const existingProjects = await dbPool
      .select({
        name: projects.name,
        prefix: projects.prefix,
      })
      .from(projects)
      .where(eq(projects.organizationId, organizationId));

    const existingProjectNames = existingProjects.map((p) => p.name);
    const existingProjectPrefixes = existingProjects
      .map((p) => p.prefix)
      .filter((p): p is string => p !== null);

    // Build system prompt for project creation
    const systemPrompt = buildProjectCreationPrompt({
      organizationId,
      organizationName: body.organizationName ?? organizationId,
      organizationSlug,
      userId: auth.user.id,
      userName: auth.user.name,
      existingProjectNames,
      existingProjectPrefixes,
      customInstructions: agentConfig.customInstructions,
    });

    // Create project creation tools
    const { proposeProject, createProjectFromProposal } =
      createProjectCreationTools({
        organizationId,
        organizationSlug,
        userId: auth.user.id,
        sessionId: session.id,
      });

    // Filter messages (same pattern as chat.endpoint.ts)
    const CONTINUATION_MARKER = "[CONTINUE_AFTER_APPROVAL]";
    const filteredMessages = (body.messages as ModelMessage[]).filter(
      (m) =>
        (m.role as string) !== "system" &&
        !(m.role === "user" && m.content === CONTINUATION_MARKER),
    );

    // Handle approvals
    const approvals = body.approvals ?? [];
    const allMessages =
      approvals.length > 0
        ? [
            ...filteredMessages,
            createApprovalCarrierMessage(approvals) as unknown as ModelMessage,
          ]
        : filteredMessages;

    // Structured request log
    const requestMeta = {
      userId: auth.user.id,
      organizationId,
      sessionId: session.id,
      messageCount: allMessages.length,
      isNewSession: !body.sessionId,
      mode: "project_creation",
    };

    // Create adapter
    const { orgApiKey, model } = agentConfig;
    const adapter = createAdapter(model, orgApiKey);

    // Create streaming response
    const aiStream: AsyncIterable<StreamChunk> = chat({
      adapter,
      // biome-ignore lint/suspicious/noExplicitAny: dynamic adapter requires cast
      messages: allMessages as any,
      tools: [proposeProject, createProjectFromProposal],
      systemPrompts: [systemPrompt],
      agentLoopStrategy: maxIterations(agentConfig.maxIterations),
    });

    // Track tool calls
    const baseToolCallCount = session.toolCallCount;

    // Wrap stream for persistence
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

        // Persist conversation after stream ends
        if (assistantContent || toolCalls.length > 0) {
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

          // Save to database (fire-and-forget)
          saveSessionMessages(session.id, finalMessages, {
            toolCalls: baseToolCallCount + newToolCallCount,
          }).catch((err) => {
            console.error("[AI] Failed to save session messages:", {
              ...requestMeta,
              error: err instanceof Error ? err.message : String(err),
              durationMs,
            });
          });

          console.info("[AI] Project creation chat completed:", {
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
      organizationId: t.String(),
      organizationName: t.Optional(t.String()),
      sessionId: t.Optional(t.String()),
      messages: t.Array(modelMessageSchema),
      approvals: t.Optional(t.Array(approvalResponseSchema)),
    }),
  },
);

export default projectCreationRoutes;
