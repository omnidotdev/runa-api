import { describe, expect, it } from "bun:test";

import { planDueDateChange } from "../normalizeDueDates";

import type { DueDateRow } from "../normalizeDueDates";

const row = (overrides: Partial<DueDateRow>): DueDateRow => ({
  id: "t1",
  dueDate: "2026-10-14T05:00:00.000000Z",
  updatedAt: "2026-09-01T00:00:00.000000Z",
  hasTimeOfDay: false,
  isUtcMidnight: false,
  zoneDayMidnight: "2026-10-14T00:00:00.000000Z",
  zoneLocal: "2026-10-14 00:00",
  ...overrides,
});

const CUTOFF = "2026-11-01T00:00:00.000Z";

describe("planDueDateChange", () => {
  it("flags a row with minutes or seconds as timed, keeping its instant", () => {
    expect(
      planDueDateChange(
        row({ dueDate: "2026-10-14T15:30:00.000000Z", hasTimeOfDay: true }),
        null,
      ),
    ).toEqual({
      id: "t1",
      oldDueDate: "2026-10-14T15:30:00.000000Z",
      oldDueHasTime: false,
      newDueDate: "2026-10-14T15:30:00.000000Z",
      newDueHasTime: true,
      reason: "timed",
    });
  });

  it("moves a zone local midnight to UTC midnight of that day", () => {
    expect(planDueDateChange(row({}), null)).toMatchObject({
      newDueDate: "2026-10-14T00:00:00.000000Z",
      newDueHasTime: false,
      reason: "local_midnight",
    });
  });

  it("treats 00:00Z as canonical without a legacy cutoff", () => {
    const canonical = row({
      dueDate: "2026-10-14T00:00:00.000000Z",
      isUtcMidnight: true,
      zoneDayMidnight: "2026-10-13T00:00:00.000000Z",
      zoneLocal: "2026-10-13 19:00",
    });
    expect(planDueDateChange(canonical, null)).toBeNull();
  });

  it("shifts legacy 00:00Z rows last written before the cutoff to their zone day", () => {
    const legacy = row({
      dueDate: "2026-10-14T00:00:00.000000Z",
      isUtcMidnight: true,
      zoneDayMidnight: "2026-10-13T00:00:00.000000Z",
      zoneLocal: "2026-10-13 19:00",
    });
    expect(planDueDateChange(legacy, CUTOFF)).toMatchObject({
      newDueDate: "2026-10-13T00:00:00.000000Z",
      reason: "legacy_utc_midnight",
    });
  });

  it("is idempotent: a row this script already wrote is past the cutoff", () => {
    const written = row({
      dueDate: "2026-10-13T00:00:00.000000Z",
      updatedAt: "2026-11-10T00:00:00.000000Z",
      isUtcMidnight: true,
      zoneDayMidnight: "2026-10-12T00:00:00.000000Z",
    });
    expect(planDueDateChange(written, CUTOFF)).toBeNull();
  });
});
