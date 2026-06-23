import { eventMeta } from "@omnidotdev/providers/events";
import { EXPORTABLE } from "graphile-export";

import type { SelectUser } from "lib/db/schema";

/** How to reach the owning organization id from a mutated row. */
export type OrgVia = "direct" | "project" | "task";

export interface ResourceEventSpec {
  /** event entity segment, e.g. "task" in `runa.task.created` */
  entity: string;
  action: "created" | "updated" | "deleted";
  /** column on the row to use as the human-readable name, or null for none */
  nameColumn: string | null;
  orgVia: OrgVia;
}

/**
 * Relational-query `with` clause needed to reach the owning organization id for
 * a given resolution strategy (none for entities that carry it directly).
 */
export const resourceEventWith = (orgVia: OrgVia) =>
  orgVia === "project"
    ? { project: { columns: { organizationId: true } } }
    : orgVia === "task"
      ? { task: { with: { project: { columns: { organizationId: true } } } } }
      : undefined;

/**
 * Shape an enriched CloudEvent payload from a mutated row and the request
 * observer. Kept pure (the plugin owns the grafast wiring and the relational
 * lookup that yields `row`) so the per-entity name and organization resolution
 * stays unit-testable. `organizationId` is set both top-level (Vortex tenancy)
 * and in `data` (consumer convenience), and omitted entirely when unresolved.
 */
export const buildResourceEvent = EXPORTABLE(
  (eventMeta) =>
    (
      spec: ResourceEventSpec,
      id: string,
      // biome-ignore lint/suspicious/noExplicitAny: row shape varies per entity
      row: any,
      observer: SelectUser | null,
    ) => {
      const rawName = spec.nameColumn ? row?.[spec.nameColumn] : null;
      const resourceName = rawName != null ? String(rawName) : null;

      const organizationId: string | undefined =
        spec.orgVia === "direct"
          ? row?.organizationId
          : spec.orgVia === "project"
            ? row?.project?.organizationId
            : row?.task?.project?.organizationId;

      return {
        type: `runa.${spec.entity}.${spec.action}`,
        data: {
          id,
          ...(organizationId ? { organizationId } : {}),
          ...eventMeta(observer, spec.entity, resourceName),
        },
        ...(organizationId ? { organizationId } : {}),
        subject: id,
      };
    },
  [eventMeta],
);
