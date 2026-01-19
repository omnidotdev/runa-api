import { existsSync, mkdirSync } from "node:fs";

import { EXPORTABLE, exportSchema } from "graphile-export";
import { makeSchema } from "postgraphile";
import { context, sideEffect } from "postgraphile/grafast";
import { replaceInFile } from "replace-in-file";

import { getDefaultOrganization } from "lib/auth/organizations";
import {
  AUTHZ_API_URL,
  AUTHZ_ENABLED,
  checkPermission,
  deleteTuples,
  writeTuples,
} from "lib/authz";
import graphilePreset from "lib/config/graphile.config";
import { checkOrganizationLimit, isWithinLimit } from "lib/entitlements";
import {
  FEATURE_KEYS,
  billingBypassOrgIds,
} from "lib/graphql/plugins/authorization/constants";
import { validateOrgExists } from "lib/idp/validateOrg";

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
      "lib/authz": {
        AUTHZ_ENABLED,
        AUTHZ_API_URL,
        checkPermission,
        writeTuples,
        deleteTuples,
      },
      "lib/entitlements": { isWithinLimit, checkOrganizationLimit },
      "./constants": {
        FEATURE_KEYS,
        billingBypassOrgIds,
      },
      "lib/auth/organizations": { getDefaultOrganization },
      "lib/idp/validateOrg": { validateOrgExists },
    },
  });

  await replaceInFile({
    files: schemaFilePath,
    from: /\/\* eslint-disable graphile-export\/export-instances, graphile-export\/export-methods, graphile-export\/export-plans, graphile-export\/exhaustive-deps \*\//g,
    to: "// @ts-nocheck",
  });

  // Remove invalid globalThis import and use native fetch
  // graphile-export doesn't recognize fetch as a known global
  await replaceInFile({
    files: schemaFilePath,
    from: /import \{ [^}]*\} from "globalThis";\n/g,
    to: "",
  });

  // Replace _fetch with fetch (native global)
  await replaceInFile({
    files: schemaFilePath,
    from: /_fetch/g,
    to: "fetch",
  });

  // Fix hardcoded AUTHZ values - replace with imports from lib/authz
  // graphile-export inlines these values at generation time, but we need them to be runtime env vars
  await replaceInFile({
    files: schemaFilePath,
    from: /import \{ checkPermission, deleteTuples, writeTuples \} from "lib\/authz";/g,
    to: 'import { AUTHZ_ENABLED, AUTHZ_API_URL, checkPermission, deleteTuples, writeTuples } from "lib/authz";',
  });

  // Fix checkPermission calls: checkPermission("...", "https://localhost:4100", ...) -> checkPermission(AUTHZ_ENABLED, AUTHZ_API_URL, ...)
  // The first arg may be "true", "", or other values depending on env during generation
  await replaceInFile({
    files: schemaFilePath,
    from: /"[^"]*", "https:\/\/localhost:4100"/g,
    to: "AUTHZ_ENABLED, AUTHZ_API_URL",
  });

  // Fix writeTuples/deleteTuples calls: writeTuples("https://localhost:4100", ...) -> writeTuples(AUTHZ_API_URL, ...)
  await replaceInFile({
    files: schemaFilePath,
    from: /writeTuples\("https:\/\/localhost:4100"/g,
    to: "writeTuples(AUTHZ_API_URL",
  });

  await replaceInFile({
    files: schemaFilePath,
    from: /deleteTuples\("https:\/\/localhost:4100"/g,
    to: "deleteTuples(AUTHZ_API_URL",
  });

  // Fix AUTHZ_API_URL guard: if (!"https://localhost:4100") -> if (!AUTHZ_API_URL)
  await replaceInFile({
    files: schemaFilePath,
    from: /if \(!"https:\/\/localhost:4100"\)/g,
    to: "if (!AUTHZ_API_URL)",
  });

  // Fix AUTHZ_ENABLED guard: if ("..." !== "true") -> if (AUTHZ_ENABLED !== "true")
  // The first value may be "", "true", or other values depending on env during generation
  await replaceInFile({
    files: schemaFilePath,
    from: /if \("[^"]*" !== "true"\)/g,
    to: 'if (AUTHZ_ENABLED !== "true")',
  });
};

await generateGraphqlSchema()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
