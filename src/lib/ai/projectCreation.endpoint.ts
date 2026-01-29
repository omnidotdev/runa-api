/**
 * Project Creation AI endpoint using Vercel AI SDK.
 *
 * POST /api/ai/project-creation/chat - SSE streaming chat for project creation
 */

import { stepCountIs, streamText, tool } from "ai";
import { and, count, eq } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { z } from "zod";

import { dbPool } from "lib/db/db";
import {
  agentSessions,
  columns,
  labels,
  projectColumns,
  projects,
  taskLabels,
  tasks,
} from "lib/db/schema";
import { isWithinLimit } from "lib/entitlements/helpers";
import { isAgentEnabled } from "lib/flags";
import { authenticateRequest, validateOrganizationAccess } from "./auth";
import { resolveAgentConfig } from "./config";
import { buildProjectCreationPrompt } from "./prompts/projectCreation";
import { createOpenRouterModel } from "./provider";
import { ORG_CHAT_LIMIT, USER_CHAT_LIMIT, checkRateLimit } from "./rateLimit";
import {
  createCreationSession,
  linkSessionToProject,
  loadCreationSession,
  saveSessionMessages,
} from "./session/manager";
import { logActivity } from "./tools/server/activity";

import type { ModelMessage } from "ai";
import type { SelectAgentSession } from "lib/db/schema";
import type { AuthenticatedUser } from "./auth";

/** Elysia/TypeBox schema for message validation. */
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

/** In-memory proposal store with TTL. */
interface StoredProposal {
  proposal: {
    name: string;
    prefix: string;
    description?: string;
    columns: Array<{ title: string; icon?: string }>;
    labels?: Array<{ name: string; color: string }>;
    initialTasks?: Array<{
      title: string;
      columnIndex: number;
      priority?: string;
      description?: string;
      labelNames?: string[];
    }>;
  };
  createdAt: Date;
  sessionId: string;
  organizationId: string;
}

const proposalStore = new Map<string, StoredProposal>();
const PROPOSAL_TTL_MS = 60 * 60 * 1000;
const MAX_PROPOSALS = 10000;
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let lastCleanupTime = 0;

function cleanupExpiredProposals(): void {
  const now = Date.now();
  if (now - lastCleanupTime < CLEANUP_INTERVAL_MS) return;
  lastCleanupTime = now;

  for (const [id, stored] of proposalStore) {
    if (now - stored.createdAt.getTime() > PROPOSAL_TTL_MS) {
      proposalStore.delete(id);
    }
  }
}

function consumeProposal(proposalId: string): StoredProposal | null {
  const stored = proposalStore.get(proposalId);
  if (!stored) return null;
  proposalStore.delete(proposalId);
  return stored;
}

function restoreProposal(proposalId: string, proposal: StoredProposal): void {
  proposalStore.set(proposalId, proposal);
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
}

async function ensureUniqueSlug(
  baseSlug: string,
  organizationId: string,
): Promise<string> {
  let slug = baseSlug;
  let suffix = 1;

  while (true) {
    const existing = await dbPool.query.projects.findFirst({
      where: (p, { and, eq }) =>
        and(eq(p.slug, slug), eq(p.organizationId, organizationId)),
      columns: { id: true },
    });

    if (!existing) return slug;

    suffix++;
    slug = `${baseSlug}-${suffix}`;

    if (suffix > 100) {
      throw new Error("Could not generate unique slug after 100 attempts");
    }
  }
}

/**
 * Project Creation AI routes.
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

    // Validate organization access
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

    // Rate-limit
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
      let loadedSession: SelectAgentSession | null = await loadCreationSession(
        body.sessionId,
        auth.user.id,
        organizationId,
      );

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

    // Get existing project names and prefixes
    const existingProjects = await dbPool
      .select({ name: projects.name, prefix: projects.prefix })
      .from(projects)
      .where(eq(projects.organizationId, organizationId));

    const existingProjectNames = existingProjects.map((p) => p.name);
    const existingProjectPrefixes = existingProjects
      .map((p) => p.prefix)
      .filter((p): p is string => p !== null);

    // Build system prompt
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

    // Tool context
    const toolContext = {
      organizationId,
      organizationSlug,
      userId: auth.user.id,
      sessionId: session.id,
    };

    // Create model instance
    const model = createOpenRouterModel(
      agentConfig.model,
      agentConfig.orgApiKey,
    );

    // Filter messages
    const messages: ModelMessage[] = (body.messages as ModelMessage[]).filter(
      (m) => (m.role as string) !== "system",
    );

    const requestMeta = {
      userId: auth.user.id,
      organizationId,
      sessionId: session.id,
      messageCount: messages.length,
      isNewSession: !body.sessionId,
      mode: "project_creation",
    };

    // Define project creation tools
    const aiTools = {
      proposeProject: tool({
        description:
          "Present a project proposal to the user for review. Use after gathering context through discovery questions.",
        inputSchema: z.object({
          name: z.string().min(3).max(100).describe("Project name"),
          prefix: z
            .string()
            .min(1)
            .max(10)
            .transform((s) => s.toUpperCase().replace(/[^A-Z0-9]/g, ""))
            .describe("Task prefix for numbering (e.g., 'MKT' for MKT-1)"),
          description: z
            .string()
            .max(500)
            .optional()
            .describe("Project description"),
          columns: z
            .array(
              z.object({
                title: z.string().min(1).max(50).describe("Column title"),
                icon: z.string().optional().describe("Emoji icon"),
              }),
            )
            .min(2)
            .max(10)
            .describe("Board columns (workflow stages)"),
          labels: z
            .array(
              z.object({
                name: z.string().min(1).max(50).describe("Label name"),
                color: z
                  .enum([
                    "gray",
                    "red",
                    "orange",
                    "yellow",
                    "green",
                    "blue",
                    "purple",
                    "pink",
                  ])
                  .describe("Label color"),
              }),
            )
            .max(10)
            .optional()
            .describe("Optional labels"),
          initialTasks: z
            .array(
              z.object({
                title: z.string().min(1).max(200).describe("Task title"),
                columnIndex: z
                  .number()
                  .int()
                  .min(0)
                  .describe("Column index (0-based)"),
                priority: z
                  .enum(["none", "low", "medium", "high", "urgent"])
                  .optional(),
                description: z.string().optional(),
                labelNames: z.array(z.string()).optional(),
              }),
            )
            .max(20)
            .optional()
            .describe("Optional initial tasks"),
        }),
        execute: async (input) => {
          cleanupExpiredProposals();

          if (proposalStore.size >= MAX_PROPOSALS) {
            throw new Error(
              "Server is experiencing high load. Please try again.",
            );
          }

          const proposalId = crypto.randomUUID();

          proposalStore.set(proposalId, {
            proposal: input,
            createdAt: new Date(),
            sessionId: toolContext.sessionId,
            organizationId: toolContext.organizationId,
          });

          const summaryLines = [
            `**${input.name}** (prefix: ${input.prefix})`,
            "",
            `**Columns (${input.columns.length}):** ${input.columns.map((c) => c.title).join(" → ")}`,
          ];

          if (input.labels && input.labels.length > 0) {
            summaryLines.push(
              `**Labels (${input.labels.length}):** ${input.labels.map((l) => l.name).join(", ")}`,
            );
          }

          if (input.initialTasks && input.initialTasks.length > 0) {
            summaryLines.push(
              `**Initial tasks:** ${input.initialTasks.length}`,
            );
          }

          if (input.description) {
            summaryLines.push("", `_${input.description}_`);
          }

          return {
            proposalId,
            status: "pending_review" as const,
            summary: summaryLines.join("\n"),
          };
        },
      }),

      createProjectFromProposal: tool({
        description:
          "Create the project from a proposal after user approval. Requires approval.",
        inputSchema: z.object({
          proposalId: z.string().describe("The proposal ID to execute"),
        }),
        needsApproval: true,
        execute: async (input) => {
          const stored = consumeProposal(input.proposalId);

          if (!stored) {
            throw new Error("Proposal not found or expired.");
          }

          if (stored.sessionId !== toolContext.sessionId) {
            restoreProposal(input.proposalId, stored);
            throw new Error("Proposal belongs to a different session.");
          }

          if (stored.organizationId !== toolContext.organizationId) {
            restoreProposal(input.proposalId, stored);
            throw new Error("Proposal belongs to a different organization.");
          }

          const proposal = stored.proposal;

          try {
            // Check entitlement: max_projects
            const projectCountResult = await dbPool
              .select({ value: count() })
              .from(projects)
              .where(eq(projects.organizationId, toolContext.organizationId));

            const currentProjectCount = projectCountResult[0]?.value ?? 0;

            const withinProjectLimit = await isWithinLimit(
              { organizationId: toolContext.organizationId },
              "max_projects",
              currentProjectCount,
            );

            if (!withinProjectLimit) {
              restoreProposal(input.proposalId, stored);
              throw new Error("Project limit reached for your plan.");
            }

            // Check task limits if initial tasks provided
            if (proposal.initialTasks && proposal.initialTasks.length > 0) {
              const taskCountResult = await dbPool
                .select({ value: count() })
                .from(tasks)
                .innerJoin(projects, eq(tasks.projectId, projects.id))
                .where(eq(projects.organizationId, toolContext.organizationId));

              const currentTaskCount = taskCountResult[0]?.value ?? 0;
              const newTaskCount =
                currentTaskCount + proposal.initialTasks.length;

              const withinTaskLimit = await isWithinLimit(
                { organizationId: toolContext.organizationId },
                "max_tasks",
                newTaskCount - 1,
              );

              if (!withinTaskLimit) {
                restoreProposal(input.proposalId, stored);
                throw new Error("Task limit would be exceeded.");
              }
            }

            // Get or create default project column
            let projectColumnId = await dbPool.query.projectColumns
              .findFirst({
                where: eq(
                  projectColumns.organizationId,
                  toolContext.organizationId,
                ),
                columns: { id: true },
              })
              .then((col) => col?.id);

            if (!projectColumnId) {
              const [newCol] = await dbPool
                .insert(projectColumns)
                .values({
                  organizationId: toolContext.organizationId,
                  title: "Active",
                  index: 0,
                })
                .returning({ id: projectColumns.id });
              projectColumnId = newCol.id;
            }

            // Generate unique slug
            const baseSlug = generateSlug(proposal.name);
            const slug = await ensureUniqueSlug(
              baseSlug,
              toolContext.organizationId,
            );

            // Execute atomic creation
            const result = await dbPool.transaction(async (tx) => {
              const [project] = await tx
                .insert(projects)
                .values({
                  name: proposal.name,
                  slug,
                  prefix: proposal.prefix,
                  description: proposal.description ?? null,
                  organizationId: toolContext.organizationId,
                  projectColumnId,
                  columnIndex: 0,
                })
                .returning({
                  id: projects.id,
                  name: projects.name,
                  slug: projects.slug,
                  prefix: projects.prefix,
                });

              const createdColumns: Array<{ id: string; title: string }> = [];
              for (let i = 0; i < proposal.columns.length; i++) {
                const col = proposal.columns[i];
                const [created] = await tx
                  .insert(columns)
                  .values({
                    projectId: project.id,
                    title: col.title,
                    icon: col.icon ?? null,
                    index: i,
                  })
                  .returning({ id: columns.id, title: columns.title });
                createdColumns.push(created);
              }

              let labelsCreated = 0;
              const labelNameToId = new Map<string, string>();

              if (proposal.labels && proposal.labels.length > 0) {
                for (const label of proposal.labels) {
                  const [created] = await tx
                    .insert(labels)
                    .values({
                      projectId: project.id,
                      name: label.name,
                      color: label.color,
                    })
                    .returning({ id: labels.id, name: labels.name });

                  labelNameToId.set(created.name.toLowerCase(), created.id);
                  labelsCreated++;
                }
              }

              let tasksCreated = 0;
              const affectedTaskIds: string[] = [];

              if (proposal.initialTasks && proposal.initialTasks.length > 0) {
                for (const task of proposal.initialTasks) {
                  const targetColumn = createdColumns[task.columnIndex];
                  if (targetColumn) {
                    const [created] = await tx
                      .insert(tasks)
                      .values({
                        content: task.title,
                        description: task.description ?? "",
                        priority: task.priority ?? "medium",
                        columnId: targetColumn.id,
                        columnIndex: tasksCreated,
                        projectId: project.id,
                        authorId: toolContext.userId,
                      })
                      .returning({ id: tasks.id });

                    affectedTaskIds.push(created.id);

                    if (task.labelNames && task.labelNames.length > 0) {
                      for (const labelName of task.labelNames) {
                        const labelId = labelNameToId.get(
                          labelName.toLowerCase(),
                        );
                        if (labelId) {
                          await tx.insert(taskLabels).values({
                            taskId: created.id,
                            labelId,
                          });
                        }
                      }
                    }

                    tasksCreated++;
                  }
                }
              }

              return {
                project,
                columnsCreated: createdColumns.length,
                labelsCreated,
                tasksCreated,
                affectedTaskIds,
              };
            });

            // Link session to new project
            await linkSessionToProject(
              toolContext.sessionId,
              result.project.id,
            );

            // Log activity
            logActivity({
              context: {
                ...toolContext,
                projectId: result.project.id,
                accessToken: "",
              },
              toolName: "createProjectFromProposal",
              toolInput: { proposalId: input.proposalId, proposal },
              toolOutput: {
                projectId: result.project.id,
                projectName: result.project.name,
                columnsCreated: result.columnsCreated,
                labelsCreated: result.labelsCreated,
                tasksCreated: result.tasksCreated,
              },
              status: "completed",
              requiresApproval: true,
              approvalStatus: "approved",
              affectedTaskIds: result.affectedTaskIds,
              snapshotBefore: {
                operation: "createProject",
                entityType: "project",
                entityId: result.project.id,
              },
            });

            const boardUrl = `/workspaces/${toolContext.organizationSlug}/projects/${result.project.slug}`;

            return {
              project: {
                id: result.project.id,
                name: result.project.name,
                slug: result.project.slug,
                prefix: result.project.prefix ?? proposal.prefix,
              },
              columnsCreated: result.columnsCreated,
              labelsCreated: result.labelsCreated,
              tasksCreated: result.tasksCreated,
              boardUrl,
            };
          } catch (error) {
            restoreProposal(input.proposalId, stored);
            throw error;
          }
        },
      }),
    };

    const baseToolCallCount = session.toolCallCount;

    // Create streaming response
    const result = streamText({
      model,
      messages,
      tools: aiTools,
      system: systemPrompt,
      stopWhen: stepCountIs(agentConfig.maxIterations),
      onFinish: async (finalResult) => {
        const durationMs = Date.now() - requestStartTime;
        const newToolCallCount = finalResult.toolCalls?.length ?? 0;

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

        console.info("[AI] Project creation chat completed:", {
          ...requestMeta,
          toolCallCount: newToolCallCount,
          durationMs,
        });
      },
    });

    const response = result.toUIMessageStreamResponse();

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
    }),
  },
);

export default projectCreationRoutes;
