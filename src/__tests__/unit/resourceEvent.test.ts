import { describe, expect, it } from "bun:test";

import {
  buildResourceEvent,
  resourceEventWith,
} from "lib/events/resourceEvent";

import type { SelectUser } from "lib/db/schema";
import type { ResourceEventSpec } from "lib/events/resourceEvent";

const observer = {
  id: "user-1",
  identityProviderId: "idp-1",
  name: "Ada",
  email: "ada@example.com",
} as SelectUser;

const actor = {
  actorId: "user-1",
  actorIdpId: "idp-1",
  actorName: "Ada",
  actorEmail: "ada@example.com",
};

describe("resourceEventWith", () => {
  it("omits a join for entities that carry the org id directly", () => {
    expect(resourceEventWith("direct")).toBeUndefined();
  });

  it("joins the project for project-owned rows", () => {
    expect(resourceEventWith("project")).toEqual({
      project: { columns: { organizationId: true } },
    });
  });

  it("joins task then project for task-owned rows", () => {
    expect(resourceEventWith("task")).toEqual({
      task: { with: { project: { columns: { organizationId: true } } } },
    });
  });
});

describe("buildResourceEvent", () => {
  it("resolves a direct-org entity (project) with its name", () => {
    const spec: ResourceEventSpec = {
      entity: "project",
      action: "created",
      nameColumn: "name",
      orgVia: "direct",
    };
    const event = buildResourceEvent(
      spec,
      "p1",
      { name: "Launch", organizationId: "org-1" },
      observer,
    );

    expect(event).toEqual({
      type: "runa.project.created",
      data: {
        id: "p1",
        organizationId: "org-1",
        resourceType: "project",
        resourceName: "Launch",
        ...actor,
      },
      organizationId: "org-1",
      subject: "p1",
    });
  });

  it("resolves a project-owned entity (task) and stringifies a numeric name", () => {
    const spec: ResourceEventSpec = {
      entity: "task",
      action: "updated",
      nameColumn: "number",
      orgVia: "project",
    };
    const event = buildResourceEvent(
      spec,
      "t1",
      { number: 42, project: { organizationId: "org-9" } },
      observer,
    );

    expect(event.type).toBe("runa.task.updated");
    expect(event.organizationId).toBe("org-9");
    expect(event.data).toMatchObject({
      id: "t1",
      organizationId: "org-9",
      resourceType: "task",
      resourceName: "42",
    });
  });

  it("resolves a task-owned entity (post) through task -> project", () => {
    const spec: ResourceEventSpec = {
      entity: "post",
      action: "deleted",
      nameColumn: "title",
      orgVia: "task",
    };
    const event = buildResourceEvent(
      spec,
      "po1",
      { title: "Bug", task: { project: { organizationId: "org-7" } } },
      observer,
    );

    expect(event.organizationId).toBe("org-7");
    expect(event.data).toMatchObject({
      resourceName: "Bug",
      actorId: "user-1",
    });
  });

  it("omits organizationId entirely when unresolved (project-scoped label)", () => {
    const spec: ResourceEventSpec = {
      entity: "label",
      action: "created",
      nameColumn: "name",
      orgVia: "direct",
    };
    const event = buildResourceEvent(
      spec,
      "l1",
      { name: "P1", organizationId: null },
      observer,
    );

    expect(event).not.toHaveProperty("organizationId");
    expect(event.data).not.toHaveProperty("organizationId");
  });

  it("omits resourceName when the column is null or missing", () => {
    const spec: ResourceEventSpec = {
      entity: "post",
      action: "created",
      nameColumn: "title",
      orgVia: "task",
    };
    const event = buildResourceEvent(
      spec,
      "po2",
      { title: null, task: { project: { organizationId: "org-2" } } },
      observer,
    );

    expect(event.data).not.toHaveProperty("resourceName");
  });

  it("degrades to id-only when the row could not be loaded (e.g. hard delete)", () => {
    const spec: ResourceEventSpec = {
      entity: "task",
      action: "deleted",
      nameColumn: "number",
      orgVia: "project",
    };
    const event = buildResourceEvent(spec, "t9", null, null);

    expect(event).toEqual({
      type: "runa.task.deleted",
      data: { id: "t9", resourceType: "task" },
      subject: "t9",
    });
  });
});
