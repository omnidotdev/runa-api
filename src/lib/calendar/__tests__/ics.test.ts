import { describe, expect, test } from "bun:test";

import { buildIcsCalendar } from "lib/calendar/ics";

const NOW = new Date("2026-10-13T12:00:00.000Z");

describe("buildIcsCalendar", () => {
  test("wraps events in a VCALENDAR with CRLF line endings", () => {
    const ics = buildIcsCalendar([], { now: NOW });
    expect(ics.startsWith("BEGIN:VCALENDAR\r\n")).toBe(true);
    expect(ics.trimEnd().endsWith("END:VCALENDAR")).toBe(true);
    expect(ics).toContain("VERSION:2.0");
  });

  test("emits one all-day VEVENT per task", () => {
    const ics = buildIcsCalendar(
      [
        { uid: "t1", title: "Ship calendar", day: "2026-10-15" },
        {
          uid: "t2",
          title: "Review PR",
          day: "2026-10-16",
          url: "https://runa.omni.dev/t2",
        },
      ],
      { now: NOW },
    );
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(2);
    expect(ics).toContain("DTSTART;VALUE=DATE:20261015");
    expect(ics).toContain("SUMMARY:Ship calendar");
    expect(ics).toContain("UID:t1@runa.omni.dev");
    expect(ics).toContain("URL:https://runa.omni.dev/t2");
    expect(ics).toContain("DTSTAMP:20261013T120000Z");
  });

  test("escapes TEXT special characters per RFC 5545", () => {
    const ics = buildIcsCalendar(
      [{ uid: "t1", title: "Fix a, b; c\nd", day: "2026-10-15" }],
      { now: NOW },
    );
    expect(ics).toContain("SUMMARY:Fix a\\, b\\; c\\nd");
  });

  test("folds long content lines at 75 octets", () => {
    const longTitle = "x".repeat(200);
    const ics = buildIcsCalendar(
      [{ uid: "t1", title: longTitle, day: "2026-10-15" }],
      { now: NOW },
    );
    // every physical line must be <= 75 chars
    for (const line of ics.split("\r\n")) {
      expect(line.length).toBeLessThanOrEqual(75);
    }
    // a folded continuation line starts with a space
    expect(ics).toMatch(/\r\n /);
  });
});
