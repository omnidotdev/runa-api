import { EXPORTABLE } from "graphile-export";

import type { ResourceChange } from "./resourceEvent";

/**
 * Build the human-readable change phrase for a change to one of a task's
 * associated records (an assignee added/removed, or a label added/removed), so
 * the task's activity feed can say "assigned Alice" / "added the Bug label"
 * instead of a generic "changed assignees". Returns an empty array when the
 * record's display name is unknown, so the feed falls back to the generic verb
 * rather than rendering a broken phrase
 */
export const buildAssocChange = EXPORTABLE(
  () =>
    (
      entity: "assignee" | "task_label",
      action: "created" | "deleted",
      name: string | null,
    ): ResourceChange[] => {
      if (!name) return [];

      if (entity === "assignee") {
        return [
          {
            field: "assignees",
            label:
              action === "created" ? `assigned ${name}` : `unassigned ${name}`,
          },
        ];
      }

      return [
        {
          field: "labels",
          label:
            action === "created"
              ? `added the ${name} label`
              : `removed the ${name} label`,
        },
      ];
    },
  [],
);
