/**
 * Request-time authorization for calendar feeds.
 *
 * A feed token is a long-lived capability URL, so it must not outlive the
 * access of the person who created it. Revoking tokens from webhooks would
 * drift (a missed or failed event leaves the URL live forever), so every feed
 * request re-checks access against current state instead:
 * - the token's workspace must not be deleted (an `organization.deleted`
 *   webhook soft-deletes its `settings` row but leaves its projects in place)
 * - a project feed's project must still exist in the token's workspace, and
 *   the token's creator must still be able to read it
 * - a personal feed's owner must still be a workspace member, and only tasks
 *   in projects they can currently read are published
 *
 * Read access uses the same Warden checks as the rest of the API (project
 * `member`, organization `member`). When authorization is not configured
 * (`AUTHZ_API_URL` unset, as in local dev and self-hosting) those checks
 * allow everything, exactly as they do for GraphQL
 */

import { and, eq, isNotNull } from "drizzle-orm";

import { checkPermission } from "lib/authz";
import { dbPool } from "lib/db/db";
import { settings, users } from "lib/db/schema";
import {
  buildProjectCalendarFeed,
  buildUserCalendarFeed,
  projectOrganizationId,
} from "./feed";

import type { ResolvedCalendarFeedToken } from "lib/tokens/calendarFeedTokens";

/** One read-access question for the authorization service */
interface FeedPermissionQuery {
  /** Identity-provider id of the user */
  userId: string;
  resourceType: "organization" | "project";
  resourceId: string;
}

/**
 * Answers whether a user can read a resource. Throws when the authorization
 * service cannot answer (the feed then fails closed, as unavailable)
 */
export type FeedPermissionCheck = (
  query: FeedPermissionQuery,
) => Promise<boolean>;

/** Warden-backed read check, shared by every check in one feed request */
const wardenFeedPermissionCheck = (): FeedPermissionCheck => {
  const requestCache = new Map<string, boolean>();
  return ({ userId, resourceType, resourceId }) =>
    resourceType === "organization"
      ? checkPermission(
          userId,
          "organization",
          resourceId,
          "member",
          "",
          requestCache,
        )
      : checkPermission(
          userId,
          "project",
          resourceId,
          "member",
          "",
          requestCache,
        );
};

/** Outcome of serving a feed token */
export type CalendarFeedResult =
  | { status: "ok"; ics: string }
  /** Unknown target or no longer authorized; served as a generic 404 */
  | { status: "not_found" }
  /** Authorization could not be checked right now; served as a 503 */
  | { status: "unavailable" };

/** Raised when the authorization service cannot answer a check */
class FeedAccessUnavailableError extends Error {}

/** Whether the workspace was deleted (its settings row soft-deleted) */
const isOrganizationDeleted = async (
  organizationId: string,
): Promise<boolean> => {
  const [row] = await dbPool
    .select({ id: settings.id })
    .from(settings)
    .where(
      and(
        eq(settings.organizationId, organizationId),
        isNotNull(settings.deletedAt),
      ),
    );
  return row !== undefined;
};

/**
 * Authorize a resolved feed token against current state and, when it is still
 * allowed, build its iCalendar document
 */
export const serveCalendarFeed = async (
  resolved: ResolvedCalendarFeedToken,
  check: FeedPermissionCheck = wardenFeedPermissionCheck(),
): Promise<CalendarFeedResult> => {
  const allowed = async (query: FeedPermissionQuery): Promise<boolean> => {
    try {
      return await check(query);
    } catch (error) {
      throw new FeedAccessUnavailableError(
        error instanceof Error ? error.message : String(error),
      );
    }
  };

  try {
    if (await isOrganizationDeleted(resolved.organizationId)) {
      return { status: "not_found" };
    }

    if (resolved.userId) {
      const [owner] = await dbPool
        .select({ identityProviderId: users.identityProviderId })
        .from(users)
        .where(eq(users.id, resolved.userId));
      if (!owner) return { status: "not_found" };

      const member = await allowed({
        userId: owner.identityProviderId,
        resourceType: "organization",
        resourceId: resolved.organizationId,
      });
      if (!member) return { status: "not_found" };

      const ics = await buildUserCalendarFeed(
        resolved.organizationId,
        resolved.userId,
        async (projectIds) => {
          const results = await Promise.all(
            projectIds.map((projectId) =>
              allowed({
                userId: owner.identityProviderId,
                resourceType: "project",
                resourceId: projectId,
              }),
            ),
          );
          return new Set(projectIds.filter((_, index) => results[index]));
        },
      );
      return { status: "ok", ics };
    }

    if (resolved.projectId) {
      // the project must still exist, in the workspace the token was issued for
      const organizationId = await projectOrganizationId(resolved.projectId);
      if (organizationId !== resolved.organizationId) {
        return { status: "not_found" };
      }

      const creatorCanRead = await allowed({
        userId: resolved.createdBy,
        resourceType: "project",
        resourceId: resolved.projectId,
      });
      if (!creatorCanRead) return { status: "not_found" };

      const ics = await buildProjectCalendarFeed(resolved.projectId);
      return ics === null ? { status: "not_found" } : { status: "ok", ics };
    }

    return { status: "not_found" };
  } catch (error) {
    if (error instanceof FeedAccessUnavailableError) {
      // never log the token itself; the token id is enough to correlate
      console.warn(
        `calendar feed ${resolved.tokenId}: authorization check failed (${error.message})`,
      );
      return { status: "unavailable" };
    }
    throw error;
  }
};
