/**
 * Extract PR URL and number from generateText result tool calls.
 *
 * Extracted as standalone module for independent testability
 * without heavy transitive dependencies from the orchestrator.
 */

export function extractPrInfo(
  // biome-ignore lint/suspicious/noExplicitAny: Vercel AI SDK tool result generics
  result: any,
): { prUrl: string; prNumber: number } | null {
  for (const step of result.steps ?? []) {
    for (const call of step.toolCalls ?? []) {
      if (call.toolName === "createPullRequest") {
        const toolResult = step.toolResults?.find(
          // biome-ignore lint/suspicious/noExplicitAny: Vercel AI SDK tool result generics
          (r: any) => r.toolCallId === call.toolCallId,
        );

        if (toolResult?.result) {
          const res = toolResult.result as {
            prUrl?: string;
            prNumber?: number;
          };

          if (res.prUrl && res.prNumber) {
            return { prUrl: res.prUrl, prNumber: res.prNumber };
          }
        }
      }
    }
  }

  return null;
}
