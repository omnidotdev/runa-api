import { EXPORTABLE } from "graphile-export";

import { allDayKey, dueDateInstant } from "lib/tasks/dueDate";

import type { ResourceChange } from "./resourceEvent";

const PRIORITY_LABELS: Record<string, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

/**
 * Build human-readable field changes for a task update from its patch, so the
 * activity feed can say WHAT changed ("moved this task to Done", "set priority
 * to High") instead of a useless "updated". `columnTitle` resolves a columnId
 * change into a move label. Ordering/timestamp fields are ignored as noise
 */
export const buildTaskChanges = EXPORTABLE(
  (PRIORITY_LABELS, allDayKey, dueDateInstant) =>
    (
      patch: Record<string, unknown> | null | undefined,
      columnTitle?: string | null,
    ): ResourceChange[] => {
      if (!patch) return [];

      const changes: ResourceChange[] = [];

      if ("columnId" in patch) {
        changes.push({
          field: "status",
          label: columnTitle
            ? `moved this task to ${columnTitle}`
            : "moved this task",
        });
      }
      if ("priority" in patch) {
        const priority = String(patch.priority ?? "");
        changes.push({
          field: "priority",
          label: `set priority to ${PRIORITY_LABELS[priority] ?? priority}`,
        });
      }
      if ("dueDate" in patch) {
        // a timed due date is labeled with its UTC date and time (the server
        // has no viewer zone); an all-day one with its tolerant calendar day
        const time =
          patch.dueHasTime === true
            ? dueDateInstant(patch.dueDate as string)
            : null;
        const day =
          time !== null
            ? `${new Date(time).toISOString().slice(0, 16).replace("T", " ")} UTC`
            : patch.dueDate
              ? allDayKey(patch.dueDate as string)
              : null;
        changes.push({
          field: "dueDate",
          label: day ? `set the due date to ${day}` : "cleared the due date",
        });
      }
      if ("content" in patch) {
        changes.push({ field: "content", label: "renamed this task" });
      }
      if ("description" in patch) {
        changes.push({ field: "description", label: "edited the description" });
      }

      return changes;
    },
  [PRIORITY_LABELS, allDayKey, dueDateInstant],
);

/** The task's stored values for the fields an update can label */
interface TaskBeforeState {
  content: string | null;
  description: string | null;
  priority: string | null;
  dueDate: string | null;
  columnId: string | null;
}

/**
 * Drop patch fields whose value did not actually change, so a client that
 * re-saves an unchanged field (e.g. the title editor re-emitting after a
 * navigation, or re-normalizing the same text into different markup) never
 * shows up in the activity feed as "renamed this task". Title text is compared
 * ignoring markup and whitespace; dates are compared as instants. Without a
 * known previous state the patch is returned unchanged
 */
export const effectiveTaskPatch = EXPORTABLE(
  () =>
    (
      patch: Record<string, unknown> | null | undefined,
      before: TaskBeforeState | null | undefined,
    ): Record<string, unknown> => {
      if (!patch) return {};
      if (!before) return patch;

      const text = (value: unknown): string =>
        String(value ?? "")
          .replace(/<[^>]*>/g, " ")
          .replace(/&nbsp;/g, " ")
          .replace(/\s+/g, " ")
          .trim();
      const instant = (value: unknown): number | null => {
        if (value == null || value === "") return null;
        // accept the Postgres text form ("2026-01-05 00:00:00+00") as well as ISO
        const iso = String(value)
          .replace(" ", "T")
          .replace(/([+-]\d{2})$/, "$1:00");
        const time = new Date(iso).getTime();
        return Number.isNaN(time) ? null : time;
      };

      const unchanged = (key: string, value: unknown): boolean => {
        switch (key) {
          case "content":
            return text(value) === text(before.content);
          case "description":
            return (value ?? "") === (before.description ?? "");
          case "priority":
            return value === before.priority;
          case "dueDate":
            return instant(value) === instant(before.dueDate);
          case "columnId":
            return value === before.columnId;
          default:
            return false;
        }
      };

      return Object.fromEntries(
        Object.entries(patch).filter(([key, value]) => !unchanged(key, value)),
      );
    },
  [],
);
