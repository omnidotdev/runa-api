import { jsonPgSmartTags } from "postgraphile/utils";

export default jsonPgSmartTags({
  version: 1,
  config: {
    class: {
      workspace: {
        attribute: {
          tier: {
            tags: {
              behavior: "-insert -update +orderBy",
            },
          },
          subscription_id: {
            tags: {
              behavior: "-insert -update",
            },
          },
        },
      },
      workspace_user: {
        attribute: {
          role: {
            tags: {
              behavior: "+orderBy",
            },
          },
        },
      },
    },
  },
});
