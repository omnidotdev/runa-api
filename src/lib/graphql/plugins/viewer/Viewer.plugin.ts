import { EXPORTABLE } from "graphile-export";
import { context, lambda } from "postgraphile/grafast";
import { gql, makeExtendSchemaPlugin } from "postgraphile/utils";

/**
 * Who the request acts as, and which workspaces it can act in.
 *
 * Integrations (the Runa MCP server in particular) need the acting user's id
 * to author content and the caller's workspace to scope work, for every kind
 * of credential: a workspace API token is bound to exactly one workspace,
 * while a user session or sign-in token carries the workspaces from its
 * organization claims. Both fields describe only the caller, so they are open
 * to any API token regardless of its scopes
 */

/** Reads one property off a plain object (or null) */
const field = (key: string) =>
  EXPORTABLE(
    (lambda, key) =>
      // biome-ignore lint/suspicious/noExplicitAny: grafast plan step
      ($value: any) =>
        lambda(
          $value,
          (value) => (value as Record<string, unknown> | null)?.[key] ?? null,
        ),
    [lambda, key],
  );

const ViewerPlugin = makeExtendSchemaPlugin(() => ({
  typeDefs: gql`
    "The user a request acts as."
    type Viewer {
      "The user's id."
      rowId: UUID!
      "The user's display name."
      name: String!
    }

    "A workspace the request can act in."
    type ViewerWorkspace {
      "The workspace (organization) id."
      id: String!
      "The workspace's URL slug, when known."
      slug: String
      "The workspace's display name, when known."
      name: String
    }

    extend type Query {
      "The user this request acts as (an API token acts as its creator)."
      viewer: Viewer
      """
      The workspaces this request can act in: the single workspace of an API
      token, or every workspace of a signed-in user.
      """
      viewerWorkspaces: [ViewerWorkspace!]!
    }
  `,
  plans: {
    Viewer: {
      rowId: field("id"),
      name: field("name"),
    },
    ViewerWorkspace: {
      id: field("id"),
      slug: field("slug"),
      name: field("name"),
    },
    Query: {
      viewer: EXPORTABLE(
        (context, lambda) => () =>
          lambda(context().get("observer"), (observer) =>
            observer ? { id: observer.id, name: observer.name } : null,
          ),
        [context, lambda],
      ),
      viewerWorkspaces: EXPORTABLE(
        (context, lambda) => () =>
          lambda(context(), (ctx) => {
            // biome-ignore lint/suspicious/noExplicitAny: grafast context shape
            const c = ctx as any;
            if (c.apiTokenPrincipal) {
              return [
                {
                  id: c.apiTokenPrincipal.organizationId,
                  slug: null,
                  name: null,
                },
              ];
            }
            if (!c.observer) return [];
            return (
              (c.organizations ?? []) as {
                id: string;
                slug?: string;
                name?: string;
              }[]
            ).map((org) => ({
              id: org.id,
              slug: org.slug ?? null,
              name: org.name ?? null,
            }));
          }),
        [context, lambda],
      ),
    },
  },
}));

export default ViewerPlugin;
