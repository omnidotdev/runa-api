import { EXPORTABLE } from "graphile-export";

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
  (PRIORITY_LABELS) =>
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
        changes.push({
          field: "dueDate",
          label: patch.dueDate
            ? `set the due date to ${String(patch.dueDate).slice(0, 10)}`
            : "cleared the due date",
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
  [PRIORITY_LABELS],
);
