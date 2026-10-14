import { EXPORTABLE } from "graphile-export";
import { context, lambda } from "postgraphile/grafast";
import { gql, makeExtendSchemaPlugin } from "postgraphile/utils";

import { checkPermission } from "lib/authz";
import { calendarFeedUrl, projectOrganizationId } from "lib/calendar/feed";
import {
  createCalendarFeedToken,
  getCalendarFeedToken,
  revokeCalendarFeedToken,
} from "lib/tokens/calendarFeedTokens";

/**
 * Authorized management API for a project's calendar subscription feed. The
 * feed token is a capability credential embedded in the feed URL, so the token
 * table is hidden from auto-CRUD (SmartTag `-*`) and managed only here. Each
 * operation requires workspace `admin` on the project's owning organization.
 * The full feed URL (which contains the secret) is returned ONLY on create;
 * the status query is secret-less. Creating regenerates (revokes the prior URL).
 */

/** Reads one property off a returned plain-object result (or null). */
const rowField = (key: string) =>
  EXPORTABLE(
    (lambda, key) =>
      // biome-ignore lint/suspicious/noExplicitAny: grafast plan step
      ($row: any) =>
        lambda(
          $row,
          (r) => (r as Record<string, unknown> | null)?.[key] ?? null,
        ),
    [lambda, key],
  );

const CalendarFeedPlugin = makeExtendSchemaPlugin(() => ({
  typeDefs: gql`
    "A project's calendar feed status, without the secret feed URL."
    type CalendarFeedStatus {
      projectId: UUID
      "Whether a live feed URL currently exists for the project."
      enabled: Boolean
      createdAt: String
      lastUsedAt: String
    }

    "Create result. The feed URL contains the secret and is shown only here."
    type CreateCalendarFeedTokenPayload {
      projectId: UUID
      url: String
    }

    type RevokeCalendarFeedTokenPayload {
      projectId: UUID
      revoked: Boolean
    }

    input CreateCalendarFeedTokenInput {
      projectId: UUID!
    }

    input RevokeCalendarFeedTokenInput {
      projectId: UUID!
    }

    extend type Mutation {
      "Create or regenerate a project's calendar feed URL (requires workspace admin). Returns the URL once."
      createCalendarFeedToken(
        input: CreateCalendarFeedTokenInput!
      ): CreateCalendarFeedTokenPayload
      "Revoke a project's calendar feed URL (requires workspace admin)."
      revokeCalendarFeedToken(
        input: RevokeCalendarFeedTokenInput!
      ): RevokeCalendarFeedTokenPayload
    }

    extend type Query {
      "A project's calendar feed status (requires workspace admin). Secret-less."
      calendarFeed(projectId: UUID!): CalendarFeedStatus
    }
  `,
  plans: {
    CreateCalendarFeedTokenPayload: {
      projectId: rowField("projectId"),
      url: rowField("url"),
    },
    RevokeCalendarFeedTokenPayload: {
      projectId: rowField("projectId"),
      revoked: rowField("revoked"),
    },
    CalendarFeedStatus: {
      projectId: rowField("projectId"),
      enabled: rowField("enabled"),
      createdAt: rowField("createdAt"),
      lastUsedAt: rowField("lastUsedAt"),
    },
    Query: {
      calendarFeed: EXPORTABLE(
        (
          context,
          lambda,
          checkPermission,
          projectOrganizationId,
          getCalendarFeedToken,
        ) =>
          // biome-ignore lint/suspicious/noExplicitAny: grafast plan signature
          (_$root: any, fieldArgs: any) => {
            const $projectId = fieldArgs.getRaw("projectId");
            const $observer = context().get("observer");
            const $accessToken = context().get("accessToken");
            const $authzCache = context().get("authzCache");
            return lambda(
              [$observer, $accessToken, $authzCache, $projectId],
              // biome-ignore lint/suspicious/noExplicitAny: grafast lambda values
              async ([observer, accessToken, authzCache, projectId]: any) => {
                if (!observer || !accessToken) throw new Error("Unauthorized");
                const organizationId = await projectOrganizationId(projectId);
                if (!organizationId) throw new Error("Not found");
                const ok = await checkPermission(
                  observer.identityProviderId,
                  "organization",
                  organizationId,
                  "admin",
                  accessToken,
                  authzCache,
                );
                if (!ok) throw new Error("Unauthorized");
                const token = await getCalendarFeedToken(
                  projectId,
                  organizationId,
                );
                return {
                  projectId,
                  enabled: token !== null,
                  createdAt: token?.createdAt ?? null,
                  lastUsedAt: token?.lastUsedAt ?? null,
                };
              },
              false,
            );
          },
        [
          context,
          lambda,
          checkPermission,
          projectOrganizationId,
          getCalendarFeedToken,
        ],
      ),
    },
    Mutation: {
      createCalendarFeedToken: EXPORTABLE(
        (
          context,
          lambda,
          checkPermission,
          projectOrganizationId,
          createCalendarFeedToken,
          calendarFeedUrl,
        ) =>
          // biome-ignore lint/suspicious/noExplicitAny: grafast plan signature
          (_$root: any, fieldArgs: any) => {
            const $input = fieldArgs.getRaw("input");
            const $observer = context().get("observer");
            const $accessToken = context().get("accessToken");
            const $authzCache = context().get("authzCache");
            return lambda(
              [$observer, $accessToken, $authzCache, $input],
              // biome-ignore lint/suspicious/noExplicitAny: grafast lambda values
              async ([observer, accessToken, authzCache, input]: any) => {
                if (!observer || !accessToken) throw new Error("Unauthorized");
                const organizationId = await projectOrganizationId(
                  input.projectId,
                );
                if (!organizationId) throw new Error("Not found");
                const ok = await checkPermission(
                  observer.identityProviderId,
                  "organization",
                  organizationId,
                  "admin",
                  accessToken,
                  authzCache,
                );
                if (!ok) throw new Error("Unauthorized");
                const { secret } = await createCalendarFeedToken({
                  organizationId,
                  projectId: input.projectId,
                  createdBy: observer.identityProviderId,
                });
                return {
                  projectId: input.projectId,
                  url: calendarFeedUrl(secret),
                };
              },
              false,
            );
          },
        [
          context,
          lambda,
          checkPermission,
          projectOrganizationId,
          createCalendarFeedToken,
          calendarFeedUrl,
        ],
      ),
      revokeCalendarFeedToken: EXPORTABLE(
        (
          context,
          lambda,
          checkPermission,
          projectOrganizationId,
          revokeCalendarFeedToken,
        ) =>
          // biome-ignore lint/suspicious/noExplicitAny: grafast plan signature
          (_$root: any, fieldArgs: any) => {
            const $input = fieldArgs.getRaw("input");
            const $observer = context().get("observer");
            const $accessToken = context().get("accessToken");
            const $authzCache = context().get("authzCache");
            return lambda(
              [$observer, $accessToken, $authzCache, $input],
              // biome-ignore lint/suspicious/noExplicitAny: grafast lambda values
              async ([observer, accessToken, authzCache, input]: any) => {
                if (!observer || !accessToken) throw new Error("Unauthorized");
                const organizationId = await projectOrganizationId(
                  input.projectId,
                );
                if (!organizationId) throw new Error("Not found");
                const ok = await checkPermission(
                  observer.identityProviderId,
                  "organization",
                  organizationId,
                  "admin",
                  accessToken,
                  authzCache,
                );
                if (!ok) throw new Error("Unauthorized");
                const revoked = await revokeCalendarFeedToken(
                  input.projectId,
                  organizationId,
                );
                return { projectId: input.projectId, revoked };
              },
              false,
            );
          },
        [
          context,
          lambda,
          checkPermission,
          projectOrganizationId,
          revokeCalendarFeedToken,
        ],
      ),
    },
  },
}));

export default CalendarFeedPlugin;
