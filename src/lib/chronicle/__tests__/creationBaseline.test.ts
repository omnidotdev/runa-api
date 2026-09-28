import { describe, expect, it } from "bun:test";

import {
  buildCreationEntry,
  formatRelativeTime,
  withCreationBaseline,
} from "../creationBaseline";

const NOW = new Date("2026-09-28T12:00:00Z");
const ago = (ms: number) => new Date(NOW.getTime() - ms).toISOString();

const S = 1000;
const MIN = 60 * S;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

describe("formatRelativeTime", () => {
  it("says 'just now' under a minute", () => {
    expect(formatRelativeTime(ago(30 * S), NOW)).toBe("just now");
  });

  it("pluralizes minutes, hours, and days", () => {
    expect(formatRelativeTime(ago(1 * MIN), NOW)).toBe("1 minute ago");
    expect(formatRelativeTime(ago(5 * MIN), NOW)).toBe("5 minutes ago");
    expect(formatRelativeTime(ago(1 * HOUR), NOW)).toBe("1 hour ago");
    expect(formatRelativeTime(ago(3 * HOUR), NOW)).toBe("3 hours ago");
    expect(formatRelativeTime(ago(1 * DAY), NOW)).toBe("1 day ago");
    expect(formatRelativeTime(ago(2 * DAY), NOW)).toBe("2 days ago");
  });

  it("falls back to a locale date past a week", () => {
    expect(formatRelativeTime(ago(10 * DAY), NOW)).toBe(
      new Date(ago(10 * DAY)).toLocaleDateString("en-US"),
    );
  });
});

describe("buildCreationEntry", () => {
  it("synthesizes a task.created anchor from the task's own row", () => {
    const entry = buildCreationEntry(
      { taskId: "t1", createdAt: ago(2 * DAY), authorName: "Alice" },
      NOW,
    );
    expect(entry).toEqual({
      id: "created:t1",
      action: "task.created",
      actorName: "Alice",
      summary: "created this task",
      detail: null,
      occurredAt: ago(2 * DAY),
      relativeTime: "2 days ago",
    });
  });

  it("returns null without a creation timestamp (nothing to anchor)", () => {
    expect(
      buildCreationEntry({ taskId: "t1", createdAt: null, authorName: "A" }),
    ).toBeNull();
  });
});

describe("withCreationBaseline", () => {
  const created = buildCreationEntry(
    { taskId: "t1", createdAt: ago(2 * DAY), authorName: "Alice" },
    NOW,
  );
  if (!created) throw new Error("expected a creation baseline entry");

  it("appends the anchor as the oldest entry when none exists", () => {
    const events = [{ action: "post.created" }];
    expect(withCreationBaseline(events, created)).toEqual([
      { action: "post.created" },
      created,
    ]);
  });

  it("does not duplicate a real task.created event from Chronicle", () => {
    const events = [{ action: "task.created" }];
    expect(withCreationBaseline(events, created)).toEqual(events);
  });

  it("returns events unchanged when there is no baseline", () => {
    const events = [{ action: "post.created" }];
    expect(withCreationBaseline(events, null)).toBe(events);
  });
});
