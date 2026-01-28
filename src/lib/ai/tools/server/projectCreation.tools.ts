/**
 * Project creation tools for AI agent.
 *
 * These tools enable the agent to create new projects with pre-populated
 * columns, labels, and initial tasks through a discovery-driven conversation.
 *
 * Flow:
 * 1. Agent asks discovery questions to understand project needs
 * 2. Agent uses `proposeProject` to present a proposal for review
 * 3. User reviews and can request changes
 * 4. Agent uses `createProjectFromProposal` (requires approval) to execute
 *
 * The proposal is stored in-memory per session with a TTL for security.
 */

import { count, eq } from "drizzle-orm";

import { dbPool } from "lib/db/db";
import {
  columns,
  labels,
  projectColumns,
  projects,
  taskLabels,
  tasks,
} from "lib/db/schema";
import { isWithinLimit } from "lib/entitlements/helpers";
import { linkSessionToProject } from "../../session/manager";
import {
  createProjectFromProposalDef,
  proposeProjectDef,
} from "../definitions";
import { logActivity } from "./activity";

/** Context for project creation tools. */
export interface ProjectCreationContext {
  organizationId: string;
  organizationSlug: string;
  userId: string;
  sessionId: string;
}

/** Stored proposal structure. */
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

/**
 * In-memory proposal store with TTL and size limit.
 *
 * Proposals are short-lived (1 hour) and scoped to session + org.
 * For production at scale, consider Redis or database storage.
 */
const proposalStore = new Map<string, StoredProposal>();

/** Proposal TTL in milliseconds (1 hour). */
const PROPOSAL_TTL_MS = 60 * 60 * 1000;

/** Maximum number of proposals to store (prevents memory exhaustion). */
const MAX_PROPOSALS = 10000;

/** Cleanup interval in milliseconds (5 minutes). */
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;

/** Last cleanup timestamp. */
let lastCleanupTime = 0;

/**
 * Clean up expired proposals from the store.
 * Called lazily on new proposal creation, throttled to avoid excessive iteration.
 */
function cleanupExpiredProposals(): void {
  const now = Date.now();

  // Throttle cleanup to run at most every CLEANUP_INTERVAL_MS
  if (now - lastCleanupTime < CLEANUP_INTERVAL_MS) {
    return;
  }
  lastCleanupTime = now;

  for (const [id, stored] of proposalStore) {
    if (now - stored.createdAt.getTime() > PROPOSAL_TTL_MS) {
      proposalStore.delete(id);
    }
  }
}

/**
 * Atomically get and delete a proposal.
 * Returns the proposal if found, null otherwise.
 * This prevents race conditions where multiple requests try to consume the same proposal.
 */
function consumeProposal(proposalId: string): StoredProposal | null {
  const stored = proposalStore.get(proposalId);
  if (!stored) return null;

  // Atomic get-and-delete
  proposalStore.delete(proposalId);
  return stored;
}

/**
 * Restore a consumed proposal (for rollback on error).
 */
function restoreProposal(proposalId: string, proposal: StoredProposal): void {
  proposalStore.set(proposalId, proposal);
}

/**
 * Generate a URL-safe slug from a project name.
 * Handles unicode, special characters, and ensures uniqueness suffix if needed.
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
}

/**
 * Ensure slug is unique within the organization.
 * Appends a numeric suffix if needed.
 */
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

    // Safety limit to prevent infinite loops
    if (suffix > 100) {
      throw new Error("Could not generate unique slug after 100 attempts");
    }
  }
}

/**
 * Create project creation tools bound to a specific context.
 *
 * @param context - The creation context (org, user, session)
 * @returns Object containing the server tool implementations
 */
export function createProjectCreationTools(context: ProjectCreationContext) {
  const proposeProject = proposeProjectDef.server(async (input) => {
    // Clean up old proposals
    cleanupExpiredProposals();

    // Check size limit to prevent memory exhaustion
    if (proposalStore.size >= MAX_PROPOSALS) {
      throw new Error(
        "Server is experiencing high load. Please try again in a few minutes.",
      );
    }

    // Generate unique proposal ID
    const proposalId = crypto.randomUUID();

    // Store proposal for later execution
    proposalStore.set(proposalId, {
      proposal: input,
      createdAt: new Date(),
      sessionId: context.sessionId,
      organizationId: context.organizationId,
    });

    // Build human-readable summary
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
      summaryLines.push(`**Initial tasks:** ${input.initialTasks.length}`);
    }

    if (input.description) {
      summaryLines.push("", `_${input.description}_`);
    }

    return {
      proposalId,
      status: "pending_review" as const,
      summary: summaryLines.join("\n"),
    };
  });

  const createProjectFromProposal = createProjectFromProposalDef.server(
    async (input) => {
      // Atomically consume the proposal to prevent race conditions
      const stored = consumeProposal(input.proposalId);

      // Validate proposal exists and belongs to this session
      if (!stored) {
        throw new Error(
          "Proposal not found or expired. Please create a new proposal using proposeProject.",
        );
      }

      if (stored.sessionId !== context.sessionId) {
        // Restore proposal since validation failed
        restoreProposal(input.proposalId, stored);
        throw new Error("Proposal belongs to a different session.");
      }

      if (stored.organizationId !== context.organizationId) {
        // Restore proposal since validation failed
        restoreProposal(input.proposalId, stored);
        throw new Error("Proposal belongs to a different organization.");
      }

      const proposal = stored.proposal;

      // Wrap entire creation in try-catch to restore proposal on failure
      try {
        return await executeProjectCreation(
          input.proposalId,
          proposal,
          context,
        );
      } catch (error) {
        // Restore proposal so user can retry
        restoreProposal(input.proposalId, stored);
        throw error;
      }
    },
  );

  return { proposeProject, createProjectFromProposal };
}

/**
 * Execute the actual project creation logic.
 * Separated for cleaner error handling with proposal restoration.
 */
async function executeProjectCreation(
  proposalId: string,
  proposal: StoredProposal["proposal"],
  context: ProjectCreationContext,
) {
  // Check entitlement: max_projects
  const projectCountResult = await dbPool
    .select({ value: count() })
    .from(projects)
    .where(eq(projects.organizationId, context.organizationId));

  const currentProjectCount = projectCountResult[0]?.value ?? 0;

  const withinProjectLimit = await isWithinLimit(
    { organizationId: context.organizationId },
    "max_projects",
    currentProjectCount,
  );

  if (!withinProjectLimit) {
    throw new Error(
      "Project limit reached for your plan. Please upgrade to create more projects.",
    );
  }

  // Check entitlement: max_tasks (if initial tasks provided)
  if (proposal.initialTasks && proposal.initialTasks.length > 0) {
    const taskCountResult = await dbPool
      .select({ value: count() })
      .from(tasks)
      .innerJoin(projects, eq(tasks.projectId, projects.id))
      .where(eq(projects.organizationId, context.organizationId));

    const currentTaskCount = taskCountResult[0]?.value ?? 0;
    const newTaskCount = currentTaskCount + proposal.initialTasks.length;

    const withinTaskLimit = await isWithinLimit(
      { organizationId: context.organizationId },
      "max_tasks",
      newTaskCount - 1, // isWithinLimit checks if currentCount < limit
    );

    if (!withinTaskLimit) {
      throw new Error(
        `Task limit would be exceeded. You have ${currentTaskCount} tasks and are trying to add ${proposal.initialTasks.length}. Please upgrade your plan.`,
      );
    }
  }

  // Get or create default project column for the org
  let projectColumnId = await dbPool.query.projectColumns
    .findFirst({
      where: eq(projectColumns.organizationId, context.organizationId),
      columns: { id: true },
    })
    .then((col) => col?.id);

  if (!projectColumnId) {
    const [newCol] = await dbPool
      .insert(projectColumns)
      .values({
        organizationId: context.organizationId,
        title: "Active",
        index: 0,
      })
      .returning({ id: projectColumns.id });
    projectColumnId = newCol.id;
  }

  // Generate unique slug
  const baseSlug = generateSlug(proposal.name);
  const slug = await ensureUniqueSlug(baseSlug, context.organizationId);

  // Execute atomic creation within transaction
  const result = await dbPool.transaction(async (tx) => {
    // 1. Create project
    const [project] = await tx
      .insert(projects)
      .values({
        name: proposal.name,
        slug,
        prefix: proposal.prefix,
        description: proposal.description ?? null,
        organizationId: context.organizationId,
        projectColumnId,
        columnIndex: 0,
      })
      .returning({
        id: projects.id,
        name: projects.name,
        slug: projects.slug,
        prefix: projects.prefix,
      });

    // 2. Create columns
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

    // 3. Create labels and build name -> id map for task assignment
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

    // 4. Create initial tasks and assign labels
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
              authorId: context.userId,
            })
            .returning({ id: tasks.id });

          affectedTaskIds.push(created.id);

          // Assign labels to task if specified
          if (task.labelNames && task.labelNames.length > 0) {
            for (const labelName of task.labelNames) {
              const labelId = labelNameToId.get(labelName.toLowerCase());
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

  // Link session to the newly created project
  await linkSessionToProject(context.sessionId, result.project.id);

  // Log activity (fire-and-forget)
  logActivity({
    context: {
      ...context,
      projectId: result.project.id,
      accessToken: "", // Not needed for activity logging
    },
    toolName: "createProjectFromProposal",
    toolInput: { proposalId, proposal },
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

  // Build board URL
  const boardUrl = `/workspaces/${context.organizationSlug}/projects/${result.project.slug}`;

  return {
    project: {
      id: result.project.id,
      name: result.project.name,
      slug: result.project.slug,
      // Prefix is required in our proposal schema, so it will always be set
      prefix: result.project.prefix ?? proposal.prefix,
    },
    columnsCreated: result.columnsCreated,
    labelsCreated: result.labelsCreated,
    tasksCreated: result.tasksCreated,
    boardUrl,
  };
}
