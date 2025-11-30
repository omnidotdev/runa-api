import { jsonPgSmartTags } from "postgraphile/utils";

export default jsonPgSmartTags({
  version: 1,
  config: {
    class: {
      workspace: {
        attribute: {
          tier: {
            tags: {
              behavior: "-insert -update",
            },
          },
          subscription_id: {
            tags: {
              behavior: "-insert -update",
            },
          },
        },
      },
    },
  },
});
