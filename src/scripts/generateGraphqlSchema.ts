import { existsSync, mkdirSync } from "node:fs";

import { EXPORTABLE, exportSchema } from "graphile-export";
import { makeSchema } from "postgraphile";
import { context, sideEffect } from "postgraphile/grafast";
import { replaceInFile } from "replace-in-file";

import graphilePreset from "lib/config/graphile.config";
import { checkWorkspaceLimit, isWithinLimit } from "lib/entitlements";
import {
  FEATURE_KEYS,
  billingBypassSlugs,
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
      "lib/entitlements": { isWithinLimit, checkWorkspaceLimit },
      "./constants": {
        FEATURE_KEYS,
        billingBypassSlugs,
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
