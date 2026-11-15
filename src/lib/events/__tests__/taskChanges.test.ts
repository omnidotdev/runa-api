import { describe, expect, it } from "bun:test";

import { buildTaskChanges, effectiveTaskPatch } from "../taskChanges";

describe("buildTaskChanges", () => {
  it("labels a column change as a move, using the resolved column title", () => {
    expect(buildTaskChanges({ columnId: "c1" }, "Done")).toEqual([
      { field: "status", label: "moved this task to Done" },
    ]);
  });

  it("falls back to a generic move when the column title is unknown", () => {
    expect(buildTaskChanges({ columnId: "c1" })).toEqual([
      { field: "status", label: "moved this task" },
    ]);
  });

  it("capitalizes priority", () => {
    expect(buildTaskChanges({ priority: "high" })).toEqual([
      { field: "priority", label: "set priority to High" },
    ]);
  });

  it("distinguishes setting vs clearing a due date", () => {
    expect(buildTaskChanges({ dueDate: "2026-01-05T00:00:00Z" })[0].label).toBe(
      "set the due date to 2026-01-05",
    );
    expect(buildTaskChanges({ dueDate: null })[0].label).toBe(
      "cleared the due date",
    );
  });

  it("labels title and description edits", () => {
    expect(buildTaskChanges({ content: "x" })[0]).toEqual({
      field: "content",
      label: "renamed this task",
    });
    expect(buildTaskChanges({ description: "x" })[0]).toEqual({
      field: "description",
      label: "edited the description",
    });
  });

  it("ignores noise fields (ordering, timestamps) and empty patches", () => {
    expect(buildTaskChanges({ columnIndex: "a0", updatedAt: "t" })).toEqual([]);
    expect(buildTaskChanges(null)).toEqual([]);
    expect(buildTaskChanges({})).toEqual([]);
  });

  it("returns multiple changes when several fields change at once", () => {
    const changes = buildTaskChanges(
      { columnId: "c1", priority: "low" },
      "To Do",
    );
    expect(changes.map((c) => c.field)).toEqual(["status", "priority"]);
  });
});

describe("effectiveTaskPatch", () => {
  const before = {
    content:
      '<p class="mb-2 last:mb-0"><span style="white-space: pre-wrap;">Research S Corp</span></p>',
    description: "<p>notes</p>",
    priority: "medium",
    dueDate: "2026-01-05 00:00:00+00",
    columnId: "c1",
  };

  it("drops a title re-save whose text is unchanged, even with different markup", () => {
    expect(
      effectiveTaskPatch({ content: "<p>Research  S Corp</p>" }, before),
    ).toEqual({});
  });

  it("keeps a real rename", () => {
    expect(
      effectiveTaskPatch({ content: "<p>Research LLC</p>" }, before),
    ).toEqual({ content: "<p>Research LLC</p>" });
  });

  it("drops unchanged description, priority, due date, and column", () => {
    expect(
      effectiveTaskPatch(
        {
          description: "<p>notes</p>",
          priority: "medium",
          dueDate: "2026-01-05T00:00:00Z",
          columnId: "c1",
        },
        before,
      ),
    ).toEqual({});
  });

  it("keeps untracked fields and returns the patch as-is without a previous state", () => {
    expect(effectiveTaskPatch({ columnIndex: "a1" }, before)).toEqual({
      columnIndex: "a1",
    });
    expect(effectiveTaskPatch({ content: "x" }, null)).toEqual({
      content: "x",
    });
  });
});
