/**
 * Public calendar feed route.
 *
 * Calendar clients (Google/Apple/Outlook) subscribe by polling a URL and cannot
 * send auth headers, so the feed authenticates by a capability token in the URL
 * path. The token is a dedicated, revocable, read-only credential scoped to one
 * project (see `calendarFeedTokens`), stored only as a hash. This route sits
 * outside the GraphQL auth plugin by design; it authenticates solely via the
 * token it resolves.
 *
 * The token must never be logged (it would otherwise land in access logs); this
 * route adds no request logging, returns a generic 404 for an unknown or revoked
 * token (no detail leaked), and marks the response `private, no-store` so shared
 * caches never retain feed contents.
 */

import { Elysia } from "elysia";

import { resolveCalendarFeedToken } from "lib/tokens/calendarFeedTokens";
import { buildProjectCalendarFeed, buildUserCalendarFeed } from "./feed";

const NOT_FOUND = "Not found";

const calendarFeedRoutes = new Elysia({ prefix: "/calendar" }).get(
  "/feed/:token",
  async ({ params, set }) => {
    // tolerate clients that append a .ics extension to the subscribe URL
    const raw = (params as Record<string, string>).token ?? "";
    const token = raw.endsWith(".ics") ? raw.slice(0, -4) : raw;

    const resolved = await resolveCalendarFeedToken(token);
    if (!resolved) {
      set.status = 404;
      return NOT_FOUND;
    }

    // a token is scoped to exactly one of a project or a user
    const ics = resolved.userId
      ? await buildUserCalendarFeed(resolved.organizationId, resolved.userId)
      : resolved.projectId
        ? await buildProjectCalendarFeed(resolved.projectId)
        : null;
    if (ics === null) {
      set.status = 404;
      return NOT_FOUND;
    }

    return new Response(ics, {
      headers: {
        "content-type": "text/calendar; charset=utf-8",
        "content-disposition": 'inline; filename="calendar.ics"',
        "cache-control": "private, no-store, max-age=0",
      },
    });
  },
);

export default calendarFeedRoutes;
