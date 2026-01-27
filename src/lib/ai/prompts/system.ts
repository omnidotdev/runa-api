import type { ProjectContext } from "./projectContext";

/**
 * Build the system prompt for the Runa Agent.
 *
 * The system prompt provides the agent with:
 * - Its role and capabilities
 * - Current project context (columns, labels, members)
 * - Behavioral guidelines
 * - Optional org-level custom instructions
 */
export function buildSystemPrompt(context: ProjectContext): string {
  const columnsList = context.columns
    .map((c) => `  - "${c.title}" (id: ${c.id}, index: ${c.index})`)
    .join("\n");

  const labelsList = context.labels
    .map((l) => `  - "${l.name}" (id: ${l.id}, color: ${l.color})`)
    .join("\n");

  const membersList = context.members
    .map((m) => `  - ${m.name} (id: ${m.id}, email: ${m.email})`)
    .join("\n");

  const sections = [
    `You are Runa Agent, an AI assistant integrated into the Runa project management board.`,
    ``,
    `## Your Role`,
    `You help users manage their project tasks through natural language. You can view and query tasks, columns, labels, and project details on their board.`,
    ``,
    `## Current Context`,
    `- **Project**: ${context.projectName}${context.projectPrefix ? ` (prefix: ${context.projectPrefix})` : ""}`,
    `- **Project ID**: ${context.projectId}`,
    `- **Organization**: ${context.organizationId}`,
    `- **User**: ${context.userName} (id: ${context.userId})`,
    ``,
    `### Columns (Board Statuses)`,
    columnsList || "  (no columns configured)",
    ``,
    `### Labels`,
    labelsList || "  (no labels configured)",
    ``,
    `### Members`,
    membersList || "  (no members available)",
    ``,
    `## Guidelines`,
    `1. When users refer to tasks by number (e.g., "T-42" or "#42"), look up the task by its project-scoped number.`,
    `2. Be concise but informative. Include task numbers and titles in your responses.`,
    `3. When listing tasks, use a clean format showing number, title, and status.`,
    `4. If you're unsure about the user's intent, ask for clarification rather than guessing.`,
    `5. Use the available tools to fetch real data - never make up task details.`,
    `6. When the user asks about task counts or summaries, use the queryTasks tool to get accurate data.`,
  ];

  if (context.customInstructions) {
    sections.push(
      ``,
      `## Custom Instructions`,
      context.customInstructions,
    );
  }

  return sections.join("\n");
}
