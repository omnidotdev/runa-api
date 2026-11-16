import { EXPORTABLE } from "graphile-export";

/**
 * Task due-date contract. `task.due_date` is a timestamptz and
 * `task.due_has_time` says how to read it:
 * - timed (`due_has_time = true`): `due_date` is the exact instant
 * - all-day (`due_has_time = false`): canonical storage is UTC midnight of the
 *   intended calendar day (`YYYY-MM-DDT00:00:00Z`)
 *
 * Older all-day rows were stored at the creator's local midnight instead, so
 * readers derive the day tolerantly as the UTC date of the NEAREST UTC midnight
 * (`due_date + 12h`). That resolves local midnights from UTC-11 through UTC+12
 * to the intended day, and is exact for canonical rows
 */

/**
 * Parse a stored due date (ISO, or the Postgres text form such as
 * `2026-01-05 00:00:00+00`) to epoch milliseconds, or null if unparseable
 */
export const dueDateInstant = EXPORTABLE(
  () =>
    (value: string | Date | null | undefined): number | null => {
      if (value == null || value === "") return null;
      if (value instanceof Date) {
        const time = value.getTime();
        return Number.isNaN(time) ? null : time;
      }
      const iso = value
        .trim()
        .replace(" ", "T")
        .replace(/([+-]\d{2})$/, "$1:00");
      const time = new Date(iso).getTime();
      return Number.isNaN(time) ? null : time;
    },
  [],
);

/**
 * The calendar day (`YYYY-MM-DD`) of an all-day due date: the UTC date of the
 * nearest UTC midnight. Falls back to the value's leading date text when it
 * cannot be parsed
 */
export const allDayKey = EXPORTABLE(
  (dueDateInstant) =>
    (value: string | Date): string => {
      const time = dueDateInstant(value);
      if (time === null) return String(value).slice(0, 10);
      const HALF_DAY_MS = 12 * 60 * 60 * 1000;
      return new Date(time + HALF_DAY_MS).toISOString().slice(0, 10);
    },
  [dueDateInstant],
);
