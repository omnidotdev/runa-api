import { EXPORTABLE } from "graphile-export";
import { context, lambda } from "postgraphile/grafast";
import { gql, makeExtendSchemaPlugin } from "postgraphile/utils";

import { pgPool } from "lib/db/db";
import { getOrCreateUnfurl } from "lib/links/unfurl";

/**
 * Custom linkPreview(url) query.
 *
 * Returns cached OpenGraph/favicon preview metadata for a URL, fetching and
 * caching it server-side on a miss (see lib/links/unfurl). Requires an
 * authenticated observer so the unfurl fetcher is not an open proxy. The favicon
 * is returned as a size-capped data URI so the client makes no cross-origin call.
 */

/** Reads one property off the returned result row (or null). */
const resultField = (key: string) =>
  EXPORTABLE(
    (lambda, key) =>
      // biome-ignore lint/suspicious/noExplicitAny: grafast plan step
      ($result: any) =>
        lambda(
          $result,
          (r) => (r as Record<string, unknown> | null)?.[key] ?? null,
        ),
    [lambda, key],
  );

const LinkPreviewPlugin = makeExtendSchemaPlugin(() => ({
  typeDefs: gql`
    """
    Cached link preview metadata for a URL.
    """
    type LinkPreview {
      "The requested URL."
      url: String
      "Either ok, or error for a cached failure."
      status: String
      "Page title (OpenGraph or document title), if any."
      title: String
      "Page description (OpenGraph), if any."
      description: String
      "OpenGraph image URL, if any."
      imageUrl: String
      "Favicon as a size-capped data URI, if fetched."
      faviconDataUri: String
    }

    extend type Query {
      """
      Fetch (and cache) OpenGraph/favicon preview metadata for an http(s) URL.
      """
      linkPreview(url: String!): LinkPreview
    }
  `,
  plans: {
    LinkPreview: {
      url: resultField("url"),
      status: resultField("status"),
      title: resultField("title"),
      description: resultField("description"),
      imageUrl: resultField("imageUrl"),
      faviconDataUri: resultField("faviconDataUri"),
    },
    Query: {
      linkPreview: EXPORTABLE(
        (context, lambda, getOrCreateUnfurl, pgPool) =>
          // biome-ignore lint/suspicious/noExplicitAny: grafast plan signature
          (_$root: any, fieldArgs: any) => {
            const $url = fieldArgs.getRaw("url");
            const $observer = context().get("observer");
            return lambda(
              [$observer, $url],
              // biome-ignore lint/suspicious/noExplicitAny: grafast lambda values
              async ([observer, url]: any) => {
                if (!observer) throw new Error("Unauthorized");
                return getOrCreateUnfurl(pgPool, url as string);
              },
              false,
            );
          },
        [context, lambda, getOrCreateUnfurl, pgPool],
      ),
    },
  },
}));

export default LinkPreviewPlugin;
