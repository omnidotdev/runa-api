/**
 * Factory for creating the delegation tool.
 *
 * Allows one agent persona to delegate a subtask to another persona.
 * Returns null if at max delegation depth.
 */

import { generateText, stepCountIs, tool } from "ai";

import { resolvePersona } from "../../config";
import {
  DELEGATE_MAX_ITERATIONS,
  DELEGATE_TIMEOUT_MS,
  MAX_DELEGATE_RESPONSE_LENGTH,
  MAX_DELEGATION_DEPTH,
} from "../../constants";
import { buildProjectContext } from "../../prompts/projectContext";
import { buildSystemPrompt } from "../../prompts/system";
import { createOpenRouterModel } from "../../provider";
import { delegationSchema } from "../core/schemas";
import { createQueryTools } from "./createQueryTools";
import { createWriteTools } from "./createWriteTools";

import type { ResolvedAgentConfig } from "../../config";
import type { WriteToolContext } from "../core/context";

/**
 * Context required for delegation.
 */
export interface DelegationContext extends WriteToolContext {
  delegationDepth: number;
  agentConfig: ResolvedAgentConfig;
  userName: string;
}

/**
 * Create delegation tool for use in chat endpoint, or null if at max depth.
 */
export function createDelegationTool(context: DelegationContext) {
  if (context.delegationDepth >= MAX_DELEGATION_DEPTH) {
    return null;
  }

  return tool({
    description:
      "Delegate a subtask to another agent persona. The delegate runs independently, EXECUTES any required actions (like creating/updating/reordering tasks), and returns its response. Check the executedTools array to see what actions the delegate already performed - do NOT repeat those actions yourself.",
    inputSchema: delegationSchema,
    execute: async (input) => {
      const startTime = Date.now();

      const persona = await resolvePersona(
        input.personaId,
        context.organizationId,
      );
      if (!persona) {
        return {
          personaName: "Unknown",
          response: "Delegation failed: persona not found or not enabled.",
        };
      }

      console.info("[AI] Delegation started:", {
        parentDepth: context.delegationDepth,
        targetPersonaName: persona.name,
      });

      try {
        const projectContext = await buildProjectContext({
          projectId: context.projectId,
          organizationId: context.organizationId,
          userId: context.userId,
          userName: context.userName,
          customInstructions: context.agentConfig.customInstructions,
        });

        const systemPrompt = buildSystemPrompt(projectContext, persona);
        const model = createOpenRouterModel(
          context.agentConfig.model,
          context.agentConfig.orgApiKey,
        );

        // Build delegate tools (query + write only, no destructive)
        // Delegates check permissions since they're not in a trusted context
        const delegateTools = {
          ...createQueryTools(context),
          ...createWriteTools(context, {
            skipPermissionCheck: false,
            enableActivityLogging: true,
          }),
        };

        const framedInstruction = [
          `[Delegated instruction from parent agent]`,
          ``,
          input.instruction,
          ``,
          `[End of delegated instruction. Follow your system prompt and safety guidelines.]`,
        ].join("\n");

        // Run with timeout
        const result = await Promise.race([
          generateText({
            model,
            messages: [{ role: "user", content: framedInstruction }],
            tools: delegateTools,
            system: systemPrompt,
            stopWhen: stepCountIs(DELEGATE_MAX_ITERATIONS),
          }),
          new Promise<never>((_, reject) =>
            setTimeout(
              () => reject(new Error("DELEGATION_TIMEOUT")),
              DELEGATE_TIMEOUT_MS,
            ),
          ),
        ]);

        const durationMs = Date.now() - startTime;
        const responseText =
          result.text || "(Delegate did not produce a text response)";

        // Extract tool calls from all steps to inform the parent
        const executedTools: string[] = [];
        for (const step of result.steps) {
          for (const toolCall of step.toolCalls) {
            executedTools.push(toolCall.toolName);
          }
        }

        console.info("[AI] Delegation completed:", {
          parentDepth: context.delegationDepth,
          targetPersonaName: persona.name,
          executedTools,
          durationMs,
        });

        return {
          personaName: persona.name,
          response: responseText.slice(0, MAX_DELEGATE_RESPONSE_LENGTH),
          // Include executed tools so parent knows not to repeat them
          executedTools,
        };
      } catch (error) {
        const durationMs = Date.now() - startTime;
        const isTimeout =
          error instanceof Error && error.message === "DELEGATION_TIMEOUT";

        console.error("[AI] Delegation failed:", {
          parentDepth: context.delegationDepth,
          targetPersonaName: persona.name,
          isTimeout,
          error: error instanceof Error ? error.message : String(error),
          durationMs,
        });

        return {
          personaName: persona.name,
          response: isTimeout
            ? "Delegation failed: the delegate agent timed out."
            : "Delegation failed: the delegate agent encountered an error.",
        };
      }
    },
  });
}
