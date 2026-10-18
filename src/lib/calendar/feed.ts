/**
 * Builds a project's read-only iCalendar feed: fetch the project's dated tasks
 * and hand them to cadence's RFC 5545 generator, one all-day VEVENT per task.
 *
 * Due dates are stored as a tz-aware instant at the picked local start-of-day
 * (see the app's `storedDueDate`), and the app renders them with `dayjs(...)`
 * in the viewer's local time. There is no viewer timezone on the server, so the
 * feed buckets each task on its UTC day (`toISOString().slice(0, 10)`), which
 * matches a viewer at/near UTC. This can land a day off for tasks whose owner
 * picked the date far east of UTC, the same imperfection the app already has;
 * fully fixing it needs a date-only column, out of scope here.
 */

import { buildIcsCalendar } from "@omnidotdev/cadence/ics";
import { and, eq, isNotNull } from "drizzle-orm";

import { PUBLIC_API_URL } from "lib/config/env.config";
import { dbPool } from "lib/db/db";
import { assignees, projects, tasks } from "lib/db/schema";

import type { IcsEvent } from "@omnidotdev/cadence/ics";

/** UID domain used for VEVENT uids; any stable domain satisfies RFC 5545. */
const UID_DOMAIN = "runa.omni.dev";

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
    .select({
      id: tasks.id,
      content: tasks.content,
      dueDate: tasks.dueDate,
    })
    .from(tasks)
    .where(and(eq(tasks.projectId, projectId), isNotNull(tasks.dueDate)));

  const events: IcsEvent[] = rows.map((row) => ({
    uid: row.id,
    title: row.content,
    // dueDate is non-null here (filtered above); bucket on its UTC day
    day: new Date(row.dueDate as string).toISOString().slice(0, 10),
  }));

  return buildIcsCalendar(events, {
    calendarName: project.name,
    uidDomain: UID_DOMAIN,
  });
};

/**
 * Build the iCalendar document for a user's own dated tasks across a workspace
 * (every project in the org where they are an assignee). Always returns a
 * document (empty when they have no dated tasks).
 */
export const buildUserCalendarFeed = async (
  organizationId: string,
  userId: string,
): Promise<string> => {
  const rows = await dbPool
    .select({ id: tasks.id, content: tasks.content, dueDate: tasks.dueDate })
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

  const events: IcsEvent[] = rows.map((row) => ({
    uid: row.id,
    title: row.content,
    day: new Date(row.dueDate as string).toISOString().slice(0, 10),
  }));

  return buildIcsCalendar(events, {
    calendarName: "My Runa tasks",
    uidDomain: UID_DOMAIN,
  });
};
