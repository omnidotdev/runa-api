/**
 * Synthesize a task's creation as an activity entry.
 *
 * A task's history in Chronicle only starts from when event instrumentation was
 * live, so tasks created earlier (or freshly created, before their first edit)
 * have no stored activity and the feed would render nothing. Every task does
 * carry its own author + creation time, so we anchor the feed with a synthetic
 * "created this task" entry - the way issue trackers always show "opened this N
 * ago" at the base of the timeline - deduped against a real `task.created` event
 * once those start flowing.
 */

import type { TaskActivityEntry } from "./taskActivity";

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const plural = (n: number, unit: string) =>
  `${n} ${unit}${n === 1 ? "" : "s"} ago`;

/**
 * Format an ISO timestamp as a short relative time ("just now", "5 minutes
 * ago", "2 days ago"), falling back to a locale date past a week - matching how
 * Chronicle renders `relativeTime`, so a synthesized entry reads the same as a
 * stored one.
 */
export const formatRelativeTime = (iso: string, now: Date = new Date()) => {
  const delta = now.getTime() - new Date(iso).getTime();
  if (delta < MINUTE) return "just now";
  if (delta < HOUR) return plural(Math.floor(delta / MINUTE), "minute");
  if (delta < DAY) return plural(Math.floor(delta / HOUR), "hour");
  if (delta < 7 * DAY) return plural(Math.floor(delta / DAY), "day");
  return new Date(iso).toLocaleDateString("en-US");
};

interface CreationBaselineInput {
  taskId: string;
  createdAt: string | null;
  authorName: string | null;
}

/**
 * Build the synthetic "created this task" anchor from a task's own row, or null
 * when the creation time is unknown (nothing to anchor to).
 */
export const buildCreationEntry = (
  { taskId, createdAt, authorName }: CreationBaselineInput,
  now: Date = new Date(),
): TaskActivityEntry | null => {
  if (!createdAt) return null;
  return {
    id: `created:${taskId}`,
    action: "task.created",
    actorName: authorName,
    summary: "created this task",
    detail: null,
    occurredAt: createdAt,
    relativeTime: formatRelativeTime(createdAt, now),
  };
};

/**
 * Append the creation anchor as the oldest entry (the feed is newest-first, so
 * it goes last), unless Chronicle already carries a real `task.created` event
 * for the task or there is no baseline to add.
 */
export const withCreationBaseline = <T extends { action: string }>(
  events: T[],
  baseline: T | null,
): T[] => {
  if (!baseline || events.some((event) => event.action === "task.created")) {
    return events;
  }
  return [...events, baseline];
};
