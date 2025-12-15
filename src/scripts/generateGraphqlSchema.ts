import { existsSync, mkdirSync } from "node:fs";

import { EXPORTABLE, exportSchema } from "graphile-export";
import { makeSchema } from "postgraphile";
import { context, sideEffect } from "postgraphile/grafast";
import { replaceInFile } from "replace-in-file";
import { match } from "ts-pattern";

import graphilePreset from "lib/config/graphile.config";
import {
  BASIC_TIER_MAX_ADMINS,
  BASIC_TIER_MAX_ASSIGNEES,
  BASIC_TIER_MAX_COLUMNS,
  BASIC_TIER_MAX_LABELS,
  BASIC_TIER_MAX_MEMBERS,
  BASIC_TIER_MAX_PROJECTS,
  BASIC_TIER_MAX_TASKS,
  FREE_TIER_MAX_ADMINS,
  FREE_TIER_MAX_ASSIGNEES,
  FREE_TIER_MAX_COLUMNS,
  FREE_TIER_MAX_LABELS,
  FREE_TIER_MAX_MEMBERS,
  FREE_TIER_MAX_PROJECTS,
  FREE_TIER_MAX_TASKS,
} from "lib/graphql/plugins/authorization/constants";

/**
 * Generate a GraphQL schema from a Postgres database.
 * @see https://postgraphile.org/postgraphile/next/exporting-schema
 */
const generateGraphqlSchema = async () => {
  const { schema } = await makeSchema(graphilePreset);

  const generatedDirectory = `${__dirname}/../generated/graphql`;
  const schemaFilePath = `${generatedDirectory}/schema.executable.ts`;

  // create artifacts directory if it doesn't exist
  if (!existsSync(generatedDirectory))
    mkdirSync(generatedDirectory, {
      recursive: true,
    });

  await exportSchema(schema, schemaFilePath, {
    mode: "typeDefs",
    modules: {
      "graphile-export": { EXPORTABLE },
      "postgraphile/grafast": { context, sideEffect },
      "ts-pattern": { match },
      "./constants": {
        FREE_TIER_MAX_PROJECTS,
        FREE_TIER_MAX_TASKS,
        FREE_TIER_MAX_ASSIGNEES,
        FREE_TIER_MAX_COLUMNS,
        FREE_TIER_MAX_LABELS,
        FREE_TIER_MAX_MEMBERS,
        FREE_TIER_MAX_ADMINS,
        BASIC_TIER_MAX_PROJECTS,
        BASIC_TIER_MAX_TASKS,
        BASIC_TIER_MAX_ASSIGNEES,
        BASIC_TIER_MAX_COLUMNS,
        BASIC_TIER_MAX_LABELS,
        BASIC_TIER_MAX_MEMBERS,
        BASIC_TIER_MAX_ADMINS,
      },
    },
  });

  await replaceInFile({
    files: schemaFilePath,
    from: /\/\* eslint-disable graphile-export\/export-instances, graphile-export\/export-methods, graphile-export\/export-plans, graphile-export\/exhaustive-deps \*\//g,
    to: "// @ts-nocheck",
  });
};

await generateGraphqlSchema()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
