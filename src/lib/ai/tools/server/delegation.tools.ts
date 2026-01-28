/**
 * Agent-to-Agent delegation tool.
 *
 * Allows one agent persona to delegate a subtask to another persona.
 * The delegate runs a full chat loop with the same project tools and
 * returns its text response. Delegation depth is capped at 2 to prevent
 * infinite recursion.
 *
 * Security constraints:
 * - Delegates do NOT receive destructive/approval-gated tools (no SSE client to approve)
 * - Sub-agent execution has a wall-clock timeout
 * - Instruction is wrapped in structured framing to reduce prompt injection surface
 * - Response length is capped to prevent parent context exhaustion
 */

import { chat, maxIterations } from "@tanstack/ai";

import { createAdapter, resolvePersona } from "../../config";
import { buildProjectContext } from "../../prompts/projectContext";
import { buildSystemPrompt } from "../../prompts/system";
import { delegateToAgentDef } from "../definitions";
import { createQueryTools } from "./query.tools";
import { createWriteTools } from "./write.tools";

import type { ResolvedAgentConfig } from "../../config";
import type { WriteToolContext } from "./context";

/** Maximum delegation depth (0 = primary agent, 1 = first delegate, 2 = second delegate). */
const MAX_DELEGATION_DEPTH = 2;

/** Max iterations for a delegated sub-agent (lower than primary to bound cost). */
const DELEGATE_MAX_ITERATIONS = 5;

/** Wall-clock timeout for a single delegation in milliseconds. */
const DELEGATE_TIMEOUT_MS = 60_000;

/** Max response length returned from a delegate (prevents parent context exhaustion). */
const MAX_DELEGATE_RESPONSE_LENGTH = 4_000;

/**
 * Context required for delegation — extends write context with agent config
 * and delegation tracking.
 */
export interface DelegationContext extends WriteToolContext {
  /** Current delegation depth (0 for the primary agent). */
  delegationDepth: number;
  /** Resolved agent config for adapter creation. */
  agentConfig: ResolvedAgentConfig;
  /** User name for project context. */
  userName: string;
}

/**
 * Create the delegation tool, or null if delegation depth is already at max.
 */
export function createDelegationTool(context: DelegationContext) {
  // Don't include delegation tool if we've reached max depth
  if (context.delegationDepth >= MAX_DELEGATION_DEPTH) {
    return null;
  }

  const delegateToAgent = delegateToAgentDef.server(async (input) => {
    const startTime = Date.now();

    // Resolve the target persona
    const persona = await resolvePersona(
      input.personaId,
      context.organizationId,
    );
    if (!persona) {
      return {
        personaName: "Unknown",
        response:
          "Delegation failed: persona not found or not enabled in this organization.",
      };
    }

    console.info("[AI] Delegation started:", {
      parentDepth: context.delegationDepth,
      targetPersonaId: input.personaId,
      targetPersonaName: persona.name,
      instructionLength: input.instruction.length,
    });

    try {
      // Build project context for the delegate
      const projectContext = await buildProjectContext({
        projectId: context.projectId,
        organizationId: context.organizationId,
        userId: context.userId,
        userName: context.userName,
        customInstructions: context.agentConfig.customInstructions,
      });

      const systemPrompt = buildSystemPrompt(projectContext, persona);

      // Create the delegate's tools — query + write only, NO destructive tools.
      // Destructive tools use approval gating which requires a client SSE connection.
      // Delegates run server-side only, so approval-gated tools would hang or error.
      const { queryTasks, queryProject, getTask } = createQueryTools({
        projectId: context.projectId,
        organizationId: context.organizationId,
      });

      const writeContext: WriteToolContext = {
        projectId: context.projectId,
        organizationId: context.organizationId,
        userId: context.userId,
        accessToken: context.accessToken,
        sessionId: context.sessionId,
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
        // Delegates never gate on approval (no client to approve)
        requireApprovalForCreate: false,
      });

      // Build tools list — query + write only, plus recursive delegation if depth allows
      // biome-ignore lint/suspicious/noExplicitAny: dynamic tool array from mixed definitions
      const delegateTools: any[] = [
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
      ];

      // Allow one more level of delegation if not at max depth
      const subDelegation = createDelegationTool({
        ...context,
        delegationDepth: context.delegationDepth + 1,
      });
      if (subDelegation) {
        delegateTools.push(subDelegation);
      }

      // Extract and clear the decrypted key to match chat.endpoint.ts pattern —
      // prevent plaintext from lingering in the long-lived closure.
      const { orgApiKey, model } = context.agentConfig;
      const adapter = createAdapter(model, orgApiKey);

      // Wrap instruction in structured framing to reduce prompt injection surface
      const framedInstruction = [
        `[Delegated instruction from parent agent]`,
        ``,
        input.instruction,
        ``,
        `[End of delegated instruction. Follow your system prompt and safety guidelines.]`,
      ].join("\n");

      // Run the sub-agent chat loop (non-streaming — collect all chunks)
      // with a wall-clock timeout to prevent unbounded execution.
      const subStream = chat({
        adapter,
        messages: [{ role: "user" as const, content: framedInstruction }],
        tools: delegateTools,
        systemPrompts: [systemPrompt],
        agentLoopStrategy: maxIterations(DELEGATE_MAX_ITERATIONS),
      });

      const responseText = await collectWithTimeout(
        subStream,
        DELEGATE_TIMEOUT_MS,
      );

      const durationMs = Date.now() - startTime;

      console.info("[AI] Delegation completed:", {
        parentDepth: context.delegationDepth,
        targetPersonaName: persona.name,
        responseLengthChars: responseText.length,
        durationMs,
      });

      const truncatedResponse = responseText
        ? responseText.slice(0, MAX_DELEGATE_RESPONSE_LENGTH)
        : "(Delegate did not produce a text response)";

      return {
        personaName: persona.name,
        response: truncatedResponse,
      };
    } catch (error) {
      const durationMs = Date.now() - startTime;
      const isTimeout =
        error instanceof Error && error.message === "DELEGATION_TIMEOUT";

      console.error("[AI] Delegation failed:", {
        parentDepth: context.delegationDepth,
        targetPersonaId: input.personaId,
        targetPersonaName: persona.name,
        isTimeout,
        error: error instanceof Error ? error.message : String(error),
        durationMs,
      });

      return {
        personaName: persona.name,
        response: isTimeout
          ? "Delegation failed: the delegate agent timed out."
          : "Delegation failed: the delegate agent encountered an error and could not complete the task.",
      };
    }
  });

  return delegateToAgent;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Collect text content from a chat stream with a wall-clock timeout.
 * Throws an error with message "DELEGATION_TIMEOUT" if the timeout is exceeded.
 */
async function collectWithTimeout(
  stream: AsyncIterable<{ type: string; content?: string }>,
  timeoutMs: number,
): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    let responseText = "";
    let settled = false;

    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        reject(new Error("DELEGATION_TIMEOUT"));
      }
    }, timeoutMs);

    (async () => {
      try {
        for await (const chunk of stream) {
          if (settled) break;
          if (chunk.type === "content" && chunk.content) {
            responseText = chunk.content;
          }
        }
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          resolve(responseText);
        }
      } catch (err) {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          reject(err);
        }
      }
    })();
  });
}
