/**
 * One-off backfill: normalize stored task due dates to the due-date contract
 * (see `lib/tasks/dueDate`). DRY RUN BY DEFAULT: prints every row it would
 * change and writes nothing. Pass `--apply` to write all changes in a single
 * transaction (take a backup first).
 *
 * Only rows with `due_date is not null and due_has_time = false` are looked at:
 * - a non-zero UTC minute or second means a timed task from before the
 *   `due_has_time` flag existed: set `due_has_time = true`, keep `due_date`
 * - otherwise it is all-day: move `due_date` to UTC midnight of the calendar
 *   day the row shows in `--zone` today
 *
 * Rows already at exactly 00:00Z are canonical and skipped, which keeps reruns
 * from shifting them again. The exception is the legacy scheme that ALSO
 * stored 00:00Z (readers in the Americas saw the previous day, which was the
 * intended one): those rows look canonical, so they are only shifted when
 * `--legacy-utc-midnight-before <ISO instant>` is passed, and only when their
 * `updated_at` is before that instant. Pick an instant before the new app
 * (which writes canonical 00:00Z) went live. Every row this script writes gets
 * `updated_at = now()`, so a rerun with the same cutoff skips it (idempotent).
 *
 * Usage:
 *   DATABASE_URL=... bun db:normalize-due-dates [--zone America/Chicago]
 *     [--legacy-utc-midnight-before 2026-11-16T00:00:00Z] [--apply]
 */

import { Client } from "pg";

const DEFAULT_ZONE = "America/Chicago";

/** A candidate row, with its instants as UTC ISO text */
export interface DueDateRow {
  id: string;
  dueDate: string;
  updatedAt: string;
  /** Non-zero UTC minute or second */
  hasTimeOfDay: boolean;
  /** Exactly 00:00:00 UTC */
  isUtcMidnight: boolean;
  /** UTC midnight of the row's calendar day in the zone */
  zoneDayMidnight: string;
  /** The row's wall-clock time in the zone, for review */
  zoneLocal: string;
}

export interface DueDateChange {
  id: string;
  oldDueDate: string;
  oldDueHasTime: false;
  newDueDate: string;
  newDueHasTime: boolean;
  reason: "timed" | "local_midnight" | "legacy_utc_midnight";
}

/** Decide the change for one row, or null to leave it alone */
export const planDueDateChange = (
  row: DueDateRow,
  legacyUtcMidnightBefore: string | null,
): DueDateChange | null => {
  const base = {
    id: row.id,
    oldDueDate: row.dueDate,
    oldDueHasTime: false as const,
  };

  if (row.hasTimeOfDay) {
    return {
      ...base,
      newDueDate: row.dueDate,
      newDueHasTime: true,
      reason: "timed",
    };
  }

  if (row.isUtcMidnight) {
    // canonical unless explicitly marked as the legacy 00:00Z scheme
    if (
      !legacyUtcMidnightBefore ||
      Date.parse(row.updatedAt) >= Date.parse(legacyUtcMidnightBefore) ||
      row.zoneDayMidnight === row.dueDate
    ) {
      return null;
    }
    return {
      ...base,
      newDueDate: row.zoneDayMidnight,
      newDueHasTime: false,
      reason: "legacy_utc_midnight",
    };
  }

  return {
    ...base,
    newDueDate: row.zoneDayMidnight,
    newDueHasTime: false,
    reason: "local_midnight",
  };
};

interface Options {
  apply: boolean;
  zone: string;
  legacyUtcMidnightBefore: string | null;
}

const USAGE =
  "Usage: bun db:normalize-due-dates [--zone <IANA zone>] [--legacy-utc-midnight-before <ISO instant>] [--apply]";

const parseArgs = (argv: string[]): Options => {
  const options: Options = {
    apply: false,
    zone: DEFAULT_ZONE,
    legacyUtcMidnightBefore: null,
  };

  for (let index = 0; index < argv.length; index++) {
    const [flag, inline] = (argv[index] ?? "").split(/=(.*)/s);
    const value = () => {
      const next = inline ?? argv[++index];
      if (!next) throw new Error(`${flag} needs a value\n${USAGE}`);
      return next;
    };

    switch (flag) {
      case "--apply":
        options.apply = true;
        break;
      case "--zone":
        options.zone = value();
        break;
      case "--legacy-utc-midnight-before":
        options.legacyUtcMidnightBefore = value();
        break;
      default:
        throw new Error(`Unknown argument ${flag}\n${USAGE}`);
    }
  }

  // throws RangeError for an unknown zone
  new Intl.DateTimeFormat("en-US", { timeZone: options.zone });

  if (options.legacyUtcMidnightBefore !== null) {
    const cutoff = Date.parse(options.legacyUtcMidnightBefore);
    if (Number.isNaN(cutoff)) {
      throw new Error("--legacy-utc-midnight-before must be an ISO instant");
    }
    // a future cutoff would match rows this script already wrote
    if (cutoff > Date.now()) {
      throw new Error("--legacy-utc-midnight-before must not be in the future");
    }
    options.legacyUtcMidnightBefore = new Date(cutoff).toISOString();
  }

  return options;
};

const ISO_UTC = `'YYYY-MM-DD"T"HH24:MI:SS.US"Z"'`;

const CANDIDATES_SQL = `
  select
    id,
    to_char(due_date at time zone 'UTC', ${ISO_UTC}) as "dueDate",
    to_char(updated_at at time zone 'UTC', ${ISO_UTC}) as "updatedAt",
    (extract(minute from due_date at time zone 'UTC') <> 0
      or extract(second from due_date at time zone 'UTC') <> 0) as "hasTimeOfDay",
    (due_date at time zone 'UTC')::time = time '00:00' as "isUtcMidnight",
    to_char(
      (due_date at time zone $1)::date::timestamp,
      'YYYY-MM-DD"T"00:00:00.000000"Z"'
    ) as "zoneDayMidnight",
    to_char(due_date at time zone $1, 'YYYY-MM-DD HH24:MI') as "zoneLocal"
  from task
  where due_date is not null and due_has_time = false
  order by due_date, id
  for update
`;

const main = async () => {
  const options = parseArgs(process.argv.slice(2));

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("`DATABASE_URL` is not defined");

  const client = new Client({ connectionString: databaseUrl });
  await client.connect();

  try {
    await client.query("begin");

    const { rows } = await client.query<DueDateRow>(CANDIDATES_SQL, [
      options.zone,
    ]);
    const changes = rows.flatMap((row) => {
      const change = planDueDateChange(row, options.legacyUtcMidnightBefore);
      return change ? [{ change, row }] : [];
    });

    // biome-ignore lint/suspicious/noConsole: script output
    console.log(
      `${options.apply ? "APPLY" : "DRY RUN"}: zone ${options.zone}, legacy 00:00Z cutoff ${options.legacyUtcMidnightBefore ?? "(none, 00:00Z rows treated as canonical)"}`,
    );
    // biome-ignore lint/suspicious/noConsole: script output
    console.log(
      `${rows.length} all-day candidate rows, ${changes.length} to change`,
    );
    for (const { change, row } of changes) {
      // biome-ignore lint/suspicious/noConsole: script output
      console.log(
        [
          change.id,
          `old due_date=${change.oldDueDate} due_has_time=${change.oldDueHasTime}`,
          `new due_date=${change.newDueDate} due_has_time=${change.newDueHasTime}`,
          `(${change.reason}; shows as ${row.zoneLocal} in ${options.zone})`,
        ].join("  "),
      );
    }

    if (!options.apply) {
      await client.query("rollback");
      // biome-ignore lint/suspicious/noConsole: script output
      console.log("Dry run only; nothing written. Re-run with --apply.");
      return;
    }

    for (const { change } of changes) {
      // guard on the values read above so a concurrent edit aborts the run
      const result = await client.query(
        `update task
           set due_date = $2::timestamptz, due_has_time = $3, updated_at = now()
         where id = $1 and due_date = $4::timestamptz and due_has_time = false`,
        [change.id, change.newDueDate, change.newDueHasTime, change.oldDueDate],
      );
      if (result.rowCount !== 1) {
        throw new Error(`Row ${change.id} changed during the run; aborting`);
      }
    }

    await client.query("commit");
    // biome-ignore lint/suspicious/noConsole: script output
    console.log(`Applied ${changes.length} changes.`);
  } catch (error) {
    await client.query("rollback").catch(() => undefined);
    throw error;
  } finally {
    await client.end();
  }
};

if (import.meta.main) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
