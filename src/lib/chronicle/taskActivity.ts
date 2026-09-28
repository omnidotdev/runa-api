/**
 * Read a task's activity from Chronicle (centralized audit/activity feeds).
 *
 * runa emits CloudEvents (see lib/events/resourceEvent) that Vortex forwards to
 * Chronicle. This is the read side: it queries Chronicle's `resourceActivity`,
 * scoped to a single organization and the task's id as the resource.
 *
 * SECURITY: Chronicle enforces no authorization on reads - any caller passing an
 * org id gets that org's data. The caller here MUST pass only the request's own
 * resolved organizationId (never a client-supplied one); the GraphQL resolver is
 * responsible for that scoping and the permission check.
 */

import { CHRONICLE_API_URL } from "lib/config/env.config";
import { buildCreationEntry, withCreationBaseline } from "./creationBaseline";

/** A flattened activity entry for a task. */
export interface TaskActivityEntry {
  id: string;
  action: string;
  actorName: string | null;
  summary: string;
  /** Field-level detail (e.g. "moved this task to Done"), when the event carries it. */
  detail: string | null;
  occurredAt: string;
  relativeTime: string;
}

const RESOURCE_ACTIVITY_QUERY = `
  query RunaTaskActivity($organizationId: ID!, $resourceId: ID!, $limit: Int!) {
    resourceActivity(organizationId: $organizationId, resourceId: $resourceId, limit: $limit) {
      id
      action
      actor { name }
      createdAt
      humanReadable
      relativeTime
      metadata
    }
  }
`;

interface ChronicleEvent {
  id: string;
  action: string;
  actor: { name: string | null } | null;
  createdAt: string;
  humanReadable: string;
  relativeTime: string;
  metadata: { changes?: Array<{ field?: string; label?: string }> } | null;
}

/** Join a task-update event's field changes into one detail phrase, or null. */
const detailFromMetadata = (
  metadata: ChronicleEvent["metadata"],
): string | null => {
  const labels = (metadata?.changes ?? [])
    .map((change) => change?.label)
    .filter((label): label is string => Boolean(label));
  return labels.length ? labels.join(", ") : null;
};

interface FetchTaskActivityArgs {
  /** The request's own resolved organization id (never client-supplied). */
  organizationId: string;
  /** The task's row id (used as Chronicle's resourceId). */
  taskId: string;
  limit?: number;
  /** The task's own creation time, to anchor the feed with a "created" entry. */
  createdAt?: string | null;
  /** Display name of the task's author, for the creation anchor. */
  authorName?: string | null;
  /** Injectable for tests; defaults to the global fetch. */
  fetchImpl?: typeof fetch;
}

/**
 * Fetch and flatten a task's activity from Chronicle, most recent first, always
 * anchored by a synthesized "created this task" entry (built from the task's own
 * row) so the feed is never empty for a real task and pre-instrumentation tasks
 * still show their origin. Returns just that anchor when Chronicle is
 * unconfigured (graceful degradation). Throws a generic, user-safe error on
 * transport/GraphQL failure; detail is logged only
 */
export const fetchTaskActivity = async ({
  organizationId,
  taskId,
  limit = 50,
  createdAt,
  authorName,
  fetchImpl = fetch,
}: FetchTaskActivityArgs): Promise<TaskActivityEntry[]> => {
  const baseline = buildCreationEntry({
    taskId,
    createdAt: createdAt ?? null,
    authorName: authorName ?? null,
  });

  if (!CHRONICLE_API_URL) return withCreationBaseline([], baseline);

  let events: ChronicleEvent[];
  try {
    const res = await fetchImpl(`${CHRONICLE_API_URL}/graphql`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        query: RESOURCE_ACTIVITY_QUERY,
        variables: { organizationId, resourceId: taskId, limit },
      }),
    });

    if (!res.ok) throw new Error(`Chronicle responded ${res.status}`);

    const json = (await res.json()) as {
      data?: { resourceActivity?: ChronicleEvent[] };
      errors?: unknown;
    };
    if (json.errors) throw new Error("Chronicle returned GraphQL errors");

    events = json.data?.resourceActivity ?? [];
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    console.error("[runa API] chronicle_task_activity_error", {
      organizationId,
      taskId,
      error: message,
    });
    throw new Error("Activity is temporarily unavailable");
  }

  const entries: TaskActivityEntry[] = events.map((event) => ({
    id: event.id,
    action: event.action,
    actorName: event.actor?.name ?? null,
    summary: event.humanReadable,
    detail: detailFromMetadata(event.metadata),
    occurredAt: event.createdAt,
    relativeTime: event.relativeTime,
  }));

  return withCreationBaseline(entries, baseline);
};
