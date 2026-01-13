import { PgAggregatesPreset } from "@graphile/pg-aggregates";
import { PgSimplifyInflectionPreset } from "@graphile/simplify-inflection";
import { makePgService } from "postgraphile/adaptors/pg";
import { PostGraphileAmberPreset } from "postgraphile/presets/amber";
import { PostGraphileConnectionFilterPreset } from "postgraphile-plugin-connection-filter";

import {
  AssigneePlugin,
  ColumnPlugin,
  EmojiPlugin,
  LabelPlugin,
  PostPlugin,
  PrimaryKeyMutationsOnlyPlugin,
  ProjectColumnPlugin,
  ProjectPlugin,
  SmartTagPlugin,
  TaskLabelPlugin,
  TaskPlugin,
  UserPlugin,
  UserPreferencePlugin,
  WorkspacePlugin,
} from "lib/graphql/plugins/authorization";
import { AuthzSyncPlugin } from "lib/graphql/plugins/authz";
import { DATABASE_URL, isDevEnv, isProdEnv } from "./env.config";

/**
 * Graphile preset.
 */
const graphilePreset: GraphileConfig.Preset = {
  extends: [
    PostGraphileAmberPreset,
    PgSimplifyInflectionPreset,
    PostGraphileConnectionFilterPreset,
    PgAggregatesPreset,
  ],
  plugins: [
    // Authorization plugins (pre-mutation validation)
    AssigneePlugin,
    ColumnPlugin,
    EmojiPlugin,
    LabelPlugin,
    PostPlugin,
    PrimaryKeyMutationsOnlyPlugin,
    ProjectPlugin,
    ProjectColumnPlugin,
    SmartTagPlugin,
    TaskPlugin,
    TaskLabelPlugin,
    UserPlugin,
    UserPreferencePlugin,
    WorkspacePlugin,
    // AuthZ sync plugin (post-mutation sync to PDP)
    AuthzSyncPlugin,
  ],
  disablePlugins: ["PgIndexBehaviorsPlugin"],
  schema: {
    retryOnInitFail: isProdEnv,
    sortExport: true,
    pgForbidSetofFunctionsToReturnNull: true,
    jsonScalarAsString: false,
    // See https://github.com/graphile-contrib/postgraphile-plugin-connection-filter?tab=readme-ov-file#handling-null-and-empty-objects
    connectionFilterAllowNullInput: true,
    connectionFilterAllowEmptyObjectInput: true,
  },
  pgServices: [makePgService({ connectionString: DATABASE_URL })],
  grafast: { explain: isDevEnv },
};

export default graphilePreset;
