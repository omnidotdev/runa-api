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
    },
  },
});

export default SmartTagPlugin;
