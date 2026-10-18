import { GraphQLError } from "graphql";

import { operationPermittedByScopes } from "lib/tokens/scopes";

import type { DocumentNode, FieldNode, OperationDefinitionNode } from "graphql";
import type { Plugin } from "graphql-yoga";
import type { GraphQLContext } from "lib/graphql/createGraphqlContext";

/**
 * Per-operation scope enforcement for API-token requests. When the request bears
 * a resolved API-token principal (set by createGraphqlContext when
 * ACCEPT_API_TOKENS is on), every selected root field must be permitted by the
 * token's granted scopes, default-deny: an operation with no mapped scope is
 * refused even to a token holding every scope. Session (observer-from-JWT)
 * requests carry no principal and are never gated here.
 */

/** The root field names a GraphQL operation selects (the operations invoked). */
export const operationRootFields = (
  document: DocumentNode,
  operationName?: string | null,
): string[] => {
  const operations = document.definitions.filter(
    (definition): definition is OperationDefinitionNode =>
      definition.kind === "OperationDefinition",
  );
  const operation = operationName
    ? operations.find((candidate) => candidate.name?.value === operationName)
    : operations[0];
  if (!operation) return [];
  return operation.selectionSet.selections
    .filter((selection): selection is FieldNode => selection.kind === "Field")
    .map((selection) => selection.name.value);
};

/**
 * The first selected root field a token's scopes do not permit, or null when
 * every field is allowed. Introspection meta-fields (`__schema`, `__typename`,
 * …) are always allowed.
 */
export const firstDeniedField = (
  rootFields: readonly string[],
  grantedScopes: readonly string[],
): string | null => {
  for (const field of rootFields) {
    if (field.startsWith("__")) continue;
    if (!operationPermittedByScopes(field, grantedScopes)) return field;
  }
  return null;
};

const tokenScopeGatePlugin: Plugin = {
  onExecute({ args }) {
    const principal = (args.contextValue as unknown as GraphQLContext)
      .apiTokenPrincipal;
    if (!principal) return;

    const denied = firstDeniedField(
      operationRootFields(args.document, args.operationName),
      principal.scopes,
    );
    if (denied) {
      // generic message; the specific field is not leaked to the caller
      throw new GraphQLError(
        "This token is not permitted to perform this operation.",
        { extensions: { code: "INSUFFICIENT_SCOPE" } },
      );
    }
  },
};

export default tokenScopeGatePlugin;
