import { makeJSONPgSmartTagsPlugin } from "postgraphile/utils";

export default makeJSONPgSmartTagsPlugin({
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
        },
      },
    },
  },
});
