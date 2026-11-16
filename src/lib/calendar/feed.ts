/**
 * Builds the read-only iCalendar feeds: fetch the dated tasks and hand them to
 * cadence's RFC 5545 generator, one VEVENT per task.
 *
 * A timed due date (`dueHasTime`) is emitted as a timed event at its stored
 * instant. An all-day due date is emitted on its calendar day, read tolerantly
 * as the nearest UTC midnight (see `allDayKey`), so both canonical UTC-midnight
 * rows and legacy rows stored at a creator's local midnight land on the
 * intended day. Task titles are stored as rich-text HTML and are reduced to
 * plain text for the event summary.
 *
 * These builders do no authorization; the feed route authorizes the token
 * first (see `feedAccess`).
 */

import { buildIcsCalendar } from "@omnidotdev/cadence/ics";
import { and, eq, isNotNull } from "drizzle-orm";

import { PUBLIC_API_URL } from "lib/config/env.config";
import { dbPool } from "lib/db/db";
import { assignees, projects, tasks } from "lib/db/schema";
import { htmlToText } from "lib/notifications/mentions";
import { allDayKey } from "lib/tasks/dueDate";

import type { IcsEvent } from "@omnidotdev/cadence/ics";

/** UID domain used for VEVENT uids; any stable domain satisfies RFC 5545. */
const UID_DOMAIN = "runa.omni.dev";

/** Columns every feed query selects for a task. */
const TASK_FEED_COLUMNS = {
  id: tasks.id,
  content: tasks.content,
  dueDate: tasks.dueDate,
  dueHasTime: tasks.dueHasTime,
};

/** Summary for a task whose title is empty once its markup is stripped */
const UNTITLED = "Untitled task";

/**
 * A task row -> an ICS event: all-day on its calendar day, or a timed event
 * (passing the stored instant as `start`) when the task carries a time-of-day.
 * dueDate is non-null here (feed queries filter it).
 */
const toIcsEvent = (row: {
  id: string;
  content: string;
  dueDate: string | null;
  dueHasTime: boolean;
}): IcsEvent => {
  const dueDate = row.dueDate as string;
  return {
    uid: row.id,
    title: htmlToText(row.content) || UNTITLED,
    day: allDayKey(dueDate),
    ...(row.dueHasTime ? { start: dueDate } : {}),
  };
};

/** The project's owning organization, or null if the project does not exist. */
export const projectOrganizationId = async (
  projectId: string,
): Promise<string | null> => {
  const [row] = await dbPool
    .select({ organizationId: projects.organizationId })
    .from(projects)
    .where(eq(projects.id, projectId));
  return row?.organizationId ?? null;
};

/** The subscribe URL a calendar client polls, carrying the capability token. */
export const calendarFeedUrl = (secret: string): string =>
  `${PUBLIC_API_URL ?? ""}/calendar/feed/${secret}`;

/**
 * Build the iCalendar document for a project, or null if the project does not
 * exist. Includes only tasks that have a due date.
 */
export const buildProjectCalendarFeed = async (
  projectId: string,
): Promise<string | null> => {
  const [project] = await dbPool
    .select({ name: projects.name })
    .from(projects)
    .where(eq(projects.id, projectId));

  if (!project) return null;

  const rows = await dbPool
    .select(TASK_FEED_COLUMNS)
    .from(tasks)
    .where(and(eq(tasks.projectId, projectId), isNotNull(tasks.dueDate)));

  return buildIcsCalendar(rows.map(toIcsEvent), {
    calendarName: project.name,
    uidDomain: UID_DOMAIN,
  });
};

/**
 * Build the iCalendar document for a user's own dated tasks across a workspace
 * (every project in the org where they are an assignee), limited to the
 * projects `readableProjectIds` says they can currently read. Always returns a
 * document (empty when they have no readable dated tasks).
 */
export const buildUserCalendarFeed = async (
  organizationId: string,
  userId: string,
  readableProjectIds: (projectIds: string[]) => Promise<Set<string>>,
): Promise<string> => {
  const rows = await dbPool
    .select({ ...TASK_FEED_COLUMNS, projectId: tasks.projectId })
    .from(tasks)
    .innerJoin(projects, eq(tasks.projectId, projects.id))
    .innerJoin(assignees, eq(assignees.taskId, tasks.id))
    .where(
      and(
        eq(projects.organizationId, organizationId),
        eq(assignees.userId, userId),
        isNotNull(tasks.dueDate),
      ),
    );

  const readable = rows.length
    ? await readableProjectIds([...new Set(rows.map((row) => row.projectId))])
    : new Set<string>();

  return buildIcsCalendar(
    rows.filter((row) => readable.has(row.projectId)).map(toIcsEvent),
    {
      calendarName: "My Runa tasks",
      uidDomain: UID_DOMAIN,
    },
  );
};
