import { jsonPgSmartTags } from "postgraphile/utils";

/**
 * Smart tag plugin, which controls Postgraphile API surface emission.
 * @see https://postgraphile.org/postgraphile/5/pg-smart-tags
 */
const SmartTagPlugin = jsonPgSmartTags({
  version: 1,
  config: {
    class: {
      // API tokens store a token hash and are managed only through the
      // authorized createApiToken/revokeApiToken mutations; hide all auto-CRUD.
      api_token: {
        tags: { behavior: "-*" },
      },
      // Attachment writes go through REST routes (so storage + DB stay in sync),
      // so hide the auto-generated insert/update/delete mutations. Reads remain.
      attachment: {
        tags: { behavior: "-insert -update -delete" },
      },
      // Internal per-URL preview cache. Clients read it only through the custom
      // `linkPreview(url)` query, so hide all auto-generated CRUD + read surface.
      link_unfurl: {
        tags: {
          behavior: "-insert -update -delete -connection -list -single",
        },
      },
      // Webhook endpoints hold a signing secret and must be gated by workspace
      // admin; until the dedicated, authorized management mutations land they
      // are fully hidden so auto-CRUD never exposes the secret or allows an
      // ungated write. Rows are created directly by the backend for now.
      webhook_endpoint: {
        tags: {
          // `-*` removes the whole type incl. Node, so it is not reachable even
          // via the global `node(id)` field (which would otherwise leak secret)
          behavior: "-*",
        },
      },
      // Internal delivery queue; never part of the public API surface.
      webhook_delivery: {
        tags: {
          behavior: "-*",
        },
      },
    },
  },
});

export default SmartTagPlugin;
