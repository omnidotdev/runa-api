import { describe, expect, it } from "bun:test";

import { buildAssocChange } from "../assocChanges";

describe("buildAssocChange", () => {
  it("labels assigning and unassigning a user by name", () => {
    expect(buildAssocChange("assignee", "created", "Alice")).toEqual([
      { field: "assignees", label: "assigned Alice" },
    ]);
    expect(buildAssocChange("assignee", "deleted", "Alice")).toEqual([
      { field: "assignees", label: "unassigned Alice" },
    ]);
  });

  it("labels adding and removing a label by name", () => {
    expect(buildAssocChange("task_label", "created", "Bug")).toEqual([
      { field: "labels", label: "added the Bug label" },
    ]);
    expect(buildAssocChange("task_label", "deleted", "Bug")).toEqual([
      { field: "labels", label: "removed the Bug label" },
    ]);
  });

  it("returns no change when the name is unknown, so the feed uses a generic verb", () => {
    expect(buildAssocChange("assignee", "created", null)).toEqual([]);
    expect(buildAssocChange("task_label", "deleted", null)).toEqual([]);
  });
});
