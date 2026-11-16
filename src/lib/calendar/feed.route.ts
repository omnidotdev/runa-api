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
 * A live token is not enough on its own: every request re-checks that the
 * token's owner can still read what it publishes (see `feedAccess`), so a feed
 * stops once its creator loses access or its project or workspace is deleted.
 *
 * The token must never be logged (it would otherwise land in access logs); this
 * route adds no request logging, returns a generic 404 for an unknown, revoked,
 * or no longer authorized token (no detail leaked), and marks every response
 * `private, no-store` so shared caches never retain feed contents. When access
 * cannot be checked (authorization service down) it answers 503, so calendar
 * clients retry instead of treating the feed as gone.
 */

import { Elysia } from "elysia";

import { resolveCalendarFeedToken } from "lib/tokens/calendarFeedTokens";
import { serveCalendarFeed } from "./feedAccess";

import type { FeedPermissionCheck } from "./feedAccess";

const NO_STORE = "private, no-store, max-age=0";

const plain = (status: number, body: string): Response =>
  new Response(body, {
    status,
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": NO_STORE,
    },
  });

/**
 * Build the feed routes. `permissionCheck` overrides the Warden read check
 * (tests inject one); by default each request gets a fresh Warden check
 */
export const createCalendarFeedRoutes = (
  permissionCheck?: () => FeedPermissionCheck,
) =>
  new Elysia({ prefix: "/calendar" }).get(
    "/feed/:token",
    async ({ params }) => {
      // tolerate clients that append a .ics extension to the subscribe URL
      const raw = (params as Record<string, string>).token ?? "";
      const token = raw.endsWith(".ics") ? raw.slice(0, -4) : raw;

      const resolved = await resolveCalendarFeedToken(token);
      if (!resolved) return plain(404, "Not found");

      const result = await serveCalendarFeed(resolved, permissionCheck?.());
      if (result.status === "not_found") return plain(404, "Not found");
      if (result.status === "unavailable") {
        return plain(503, "Service unavailable");
      }

      return new Response(result.ics, {
        headers: {
          "content-type": "text/calendar; charset=utf-8",
          "content-disposition": 'inline; filename="calendar.ics"',
          "cache-control": NO_STORE,
        },
      });
    },
  );

const calendarFeedRoutes = createCalendarFeedRoutes();

export default calendarFeedRoutes;
