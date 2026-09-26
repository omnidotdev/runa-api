import { jsonPgSmartTags } from "postgraphile/utils";

/**
 * Smart tag plugin, which controls Postgraphile API surface emission.
 * @see https://postgraphile.org/postgraphile/5/pg-smart-tags
 */
const SmartTagPlugin = jsonPgSmartTags({
  version: 1,
  config: {
    class: {
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
    },
  },
});

export default SmartTagPlugin;
