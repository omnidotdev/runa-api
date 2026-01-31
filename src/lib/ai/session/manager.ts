import { and, desc, eq, isNull } from "drizzle-orm";

import { dbPool } from "lib/db/db";
import { agentSessions } from "lib/db/schema";

import type { InsertAgentSession, SelectAgentSession } from "lib/db/schema";
import type { DiscoveryState } from "../discovery/state";

/**
 * Create a new agent chat session for an existing project.
 */
export async function createSession(params: {
  organizationId: string;
  projectId: string;
  userId: string;
  title?: string;
}): Promise<SelectAgentSession> {
  const [session] = await dbPool
    .insert(agentSessions)
    .values({
      organizationId: params.organizationId,
      projectId: params.projectId,
      userId: params.userId,
      type: "project_chat",
      title: params.title ?? null,
      messages: [],
    })
    .returning();

  return session;
}

/**
 * Create a new project creation session.
 * These sessions don't have a projectId until the project is created.
 */
export async function createCreationSession(params: {
  organizationId: string;
  userId: string;
  title?: string;
}): Promise<SelectAgentSession> {
  const [session] = await dbPool
    .insert(agentSessions)
    .values({
      organizationId: params.organizationId,
      projectId: null,
      userId: params.userId,
      type: "project_creation",
      title: params.title ?? "New Project",
      messages: [],
    })
    .returning();

  return session;
}

/**
 * Load an existing session by ID.
 * Returns null if not found, user doesn't own the session, or
 * the session belongs to a different project.
 *
 * @param sessionId - Session ID to load
 * @param userId - User ID (must own the session)
 * @param projectId - Project ID (null for creation sessions)
 */
export async function loadSession(
  sessionId: string,
  userId: string,
  projectId: string | null,
): Promise<SelectAgentSession | null> {
  const projectCondition =
    projectId === null
      ? isNull(agentSessions.projectId)
      : eq(agentSessions.projectId, projectId);

  const session = await dbPool.query.agentSessions.findFirst({
    where: and(
      eq(agentSessions.id, sessionId),
      eq(agentSessions.userId, userId),
      projectCondition,
    ),
  });

  return session ?? null;
}

/**
 * Load a creation session by ID (org-scoped, no project).
 * Used for project creation flow where session is not tied to a project.
 *
 * Only returns sessions that haven't been linked to a project yet
 * (projectId IS NULL). Sessions that have completed project creation
 * should be loaded via loadSession instead.
 */
export async function loadCreationSession(
  sessionId: string,
  userId: string,
  organizationId: string,
): Promise<SelectAgentSession | null> {
  const session = await dbPool.query.agentSessions.findFirst({
    where: and(
      eq(agentSessions.id, sessionId),
      eq(agentSessions.userId, userId),
      eq(agentSessions.organizationId, organizationId),
      eq(agentSessions.type, "project_creation"),
      // Only load sessions that haven't been linked to a project yet
      isNull(agentSessions.projectId),
    ),
  });

  return session ?? null;
}

/**
 * Update a session's projectId after project creation.
 * Used to link a creation session to the newly created project.
 */
export async function linkSessionToProject(
  sessionId: string,
  projectId: string,
): Promise<void> {
  await dbPool
    .update(agentSessions)
    .set({
      projectId,
      type: "project_chat",
      updatedAt: new Date().toISOString(),
    })
    .where(eq(agentSessions.id, sessionId));
}

/**
 * Save updated messages and usage stats to a session.
 */
export async function saveSessionMessages(
  sessionId: string,
  messages: unknown[],
  stats?: { toolCalls?: number },
): Promise<void> {
  const updateValues: Partial<InsertAgentSession> = {
    messages: messages as InsertAgentSession["messages"],
    updatedAt: new Date().toISOString(),
  };

  if (stats?.toolCalls) {
    updateValues.toolCallCount = stats.toolCalls;
  }

  await dbPool
    .update(agentSessions)
    .set(updateValues)
    .where(eq(agentSessions.id, sessionId));
}

/**
 * Update a session's title.
 */
export async function updateSessionTitle(
  sessionId: string,
  title: string,
): Promise<void> {
  await dbPool
    .update(agentSessions)
    .set({
      title,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(agentSessions.id, sessionId));
}

/**
 * List sessions for a user in a project, ordered by most recent.
 */
export async function listSessions(
  projectId: string,
  userId: string,
  limit = 20,
): Promise<
  Array<
    Pick<
      SelectAgentSession,
      "id" | "title" | "toolCallCount" | "createdAt" | "updatedAt"
    >
  >
> {
  return dbPool
    .select({
      id: agentSessions.id,
      title: agentSessions.title,
      toolCallCount: agentSessions.toolCallCount,
      createdAt: agentSessions.createdAt,
      updatedAt: agentSessions.updatedAt,
    })
    .from(agentSessions)
    .where(
      and(
        eq(agentSessions.projectId, projectId),
        eq(agentSessions.userId, userId),
      ),
    )
    .orderBy(desc(agentSessions.updatedAt))
    .limit(limit);
}

/**
 * Load discovery state from session metadata.
 * Returns null if no discovery state exists.
 */
export async function loadDiscoveryState(
  sessionId: string,
): Promise<DiscoveryState | null> {
  const session = await dbPool.query.agentSessions.findFirst({
    where: eq(agentSessions.id, sessionId),
    columns: { metadata: true },
  });

  const metadata = session?.metadata as
    | { discoveryState?: DiscoveryState }
    | undefined;
  return metadata?.discoveryState ?? null;
}

/**
 * Save discovery state to session metadata.
 */
export async function saveDiscoveryState(
  sessionId: string,
  discoveryState: DiscoveryState,
): Promise<void> {
  const session = await dbPool.query.agentSessions.findFirst({
    where: eq(agentSessions.id, sessionId),
    columns: { metadata: true },
  });

  const currentMetadata = (session?.metadata as Record<string, unknown>) ?? {};

  await dbPool
    .update(agentSessions)
    .set({
      metadata: {
        ...currentMetadata,
        discoveryState,
      },
      updatedAt: new Date().toISOString(),
    })
    .where(eq(agentSessions.id, sessionId));
}
