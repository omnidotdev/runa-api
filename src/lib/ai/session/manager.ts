import { and, desc, eq } from "drizzle-orm";

import { dbPool } from "lib/db/db";
import { agentSessions } from "lib/db/schema";

import type { InsertAgentSession, SelectAgentSession } from "lib/db/schema";

/**
 * Create a new agent chat session.
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
      title: params.title ?? null,
      messages: [],
    })
    .returning();

  return session;
}

/**
 * Load an existing session by ID.
 * Returns null if not found, user doesn't own the session, or
 * the session belongs to a different project.
 */
export async function loadSession(
  sessionId: string,
  userId: string,
  projectId: string,
): Promise<SelectAgentSession | null> {
  const session = await dbPool.query.agentSessions.findFirst({
    where: and(
      eq(agentSessions.id, sessionId),
      eq(agentSessions.userId, userId),
      eq(agentSessions.projectId, projectId),
    ),
  });

  return session ?? null;
}

/**
 * Save updated messages and usage stats to a session.
 */
export async function saveSessionMessages(
  sessionId: string,
  messages: unknown[],
  stats?: { tokensUsed?: number; toolCalls?: number },
): Promise<void> {
  const updateValues: Partial<InsertAgentSession> = {
    messages: messages as InsertAgentSession["messages"],
    updatedAt: new Date().toISOString(),
  };

  if (stats?.tokensUsed) {
    updateValues.totalTokensUsed = stats.tokensUsed;
  }
  if (stats?.toolCalls) {
    updateValues.toolCallCount = stats.toolCalls;
  }

  await dbPool
    .update(agentSessions)
    .set(updateValues)
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
  Array<Pick<SelectAgentSession, "id" | "title" | "toolCallCount" | "createdAt" | "updatedAt">>
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
