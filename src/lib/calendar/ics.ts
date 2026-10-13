/**
 * RFC 5545 (iCalendar) generation for task due dates. Pure and dependency-free:
 * the route/feed layer fetches the viewer's dated tasks and hands them here. Each
 * task becomes an all-day VEVENT on its due day. Reused by an authenticated
 * `.ics` export and, later, a subscribable feed.
 */

/** One task to publish as a calendar event. */
interface IcsEvent {
  /** Stable unique id (e.g. the task id). */
  uid: string;
  /** Event title. */
  title: string;
  /** Local due day, `YYYY-MM-DD` (rendered as an all-day event). */
  day: string;
  /** Optional link back to the task. */
  url?: string;
}

/** Escape a TEXT value per RFC 5545 (backslash, comma, semicolon, newline). */
const escapeText = (value: string): string =>
  value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");

/** `YYYY-MM-DD` -> `YYYYMMDD` for a DATE value. */
const toIcsDate = (day: string): string => day.replace(/-/g, "");

/**
 * Fold a content line to <=75 octets per RFC 5545 (continuations start with a
 * space). Approximated on string length, which is correct for ASCII content.
 */
const foldLine = (line: string): string => {
  if (line.length <= 75) return line;
  const parts: string[] = [line.slice(0, 75)];
  let rest = line.slice(75);
  while (rest.length > 74) {
    parts.push(` ${rest.slice(0, 74)}`);
    rest = rest.slice(74);
  }
  parts.push(` ${rest}`);
  return parts.join("\r\n");
};

/**
 * Build an iCalendar document (CRLF line endings) with one all-day VEVENT per
 * task. `now` is injectable so DTSTAMP is deterministic in tests.
 */
export const buildIcsCalendar = (
  events: readonly IcsEvent[],
  options: { calendarName?: string; now?: Date } = {},
): string => {
  const { calendarName = "Runa", now = new Date() } = options;
  const dtstamp = `${now
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z")}`;

  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Omni//Runa//EN",
    "CALSCALE:GREGORIAN",
    `X-WR-CALNAME:${escapeText(calendarName)}`,
  ];

  for (const event of events) {
    lines.push(
      "BEGIN:VEVENT",
      `UID:${escapeText(event.uid)}@runa.omni.dev`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART;VALUE=DATE:${toIcsDate(event.day)}`,
      `SUMMARY:${escapeText(event.title)}`,
    );
    if (event.url) lines.push(`URL:${escapeText(event.url)}`);
    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");
  return `${lines.map(foldLine).join("\r\n")}\r\n`;
};
