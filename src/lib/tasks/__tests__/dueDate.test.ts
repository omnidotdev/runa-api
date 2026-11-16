import { describe, expect, it } from "bun:test";

import { allDayKey, dueDateInstant } from "../dueDate";

describe("allDayKey", () => {
  it("reads a canonical UTC-midnight all-day date as that day", () => {
    expect(allDayKey("2026-10-14T00:00:00Z")).toBe("2026-10-14");
    expect(allDayKey("2026-10-14 00:00:00+00")).toBe("2026-10-14");
  });

  it("reads a legacy local midnight east of UTC as the intended day", () => {
    // 2026-10-14 00:00 at UTC+1, UTC+5:30, and UTC+12
    expect(allDayKey("2026-10-14T00:00:00+01:00")).toBe("2026-10-14");
    expect(allDayKey("2026-10-13T23:00:00Z")).toBe("2026-10-14");
    expect(allDayKey("2026-10-13T18:30:00Z")).toBe("2026-10-14");
    expect(allDayKey("2026-10-13T12:00:00Z")).toBe("2026-10-14");
  });

  it("reads a legacy local midnight west of UTC as the intended day", () => {
    // 2026-10-14 00:00 at UTC-5, UTC-6, and UTC-11
    expect(allDayKey("2026-10-14T05:00:00Z")).toBe("2026-10-14");
    expect(allDayKey("2026-10-14 06:00:00+00")).toBe("2026-10-14");
    expect(allDayKey("2026-10-14T11:00:00Z")).toBe("2026-10-14");
  });

  it("accepts a Date", () => {
    expect(allDayKey(new Date("2026-10-13T23:00:00Z"))).toBe("2026-10-14");
  });

  it("falls back to the leading date text when unparseable", () => {
    expect(allDayKey("2026-10-14garbage")).toBe("2026-10-14");
  });
});

describe("dueDateInstant", () => {
  it("parses ISO and Postgres text forms to the same instant", () => {
    const iso = Date.parse("2026-10-14T06:00:00Z");
    expect(dueDateInstant("2026-10-14T06:00:00Z")).toBe(iso);
    expect(dueDateInstant("2026-10-14 06:00:00+00")).toBe(iso);
    expect(dueDateInstant("2026-10-14 01:00:00-05")).toBe(iso);
  });

  it("is null for empty or unparseable values", () => {
    expect(dueDateInstant(null)).toBeNull();
    expect(dueDateInstant("")).toBeNull();
    expect(dueDateInstant("not a date")).toBeNull();
  });
});
