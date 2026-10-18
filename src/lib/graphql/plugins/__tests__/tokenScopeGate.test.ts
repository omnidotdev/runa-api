/**
 * Pure unit tests for the token scope-gate logic: extracting an operation's
 * root fields and deciding the first field a token's scopes do not permit.
 */

import { describe, expect, test } from "bun:test";

import { parse } from "graphql";

import {
  firstDeniedField,
  operationRootFields,
} from "lib/graphql/plugins/tokenScopeGate.plugin";

describe("operationRootFields", () => {
  test("returns the selected root fields of the (named) operation", () => {
    const doc = parse(`
      query Board { tasks { nodes { rowId } } projects { nodes { rowId } } }
    `);
    expect(operationRootFields(doc, "Board")).toEqual(["tasks", "projects"]);
  });

  test("falls back to the first operation when no name is given", () => {
    const doc = parse("mutation { createTask(input: {}) { task { rowId } } }");
    expect(operationRootFields(doc)).toEqual(["createTask"]);
  });
});

describe("firstDeniedField", () => {
  test("allows when every root field is within the granted scopes", () => {
    expect(
      firstDeniedField(["tasks", "createTask"], ["task:read", "task:write"]),
    ).toBeNull();
  });

  test("denies the first field outside the granted scopes", () => {
    expect(firstDeniedField(["tasks", "createTask"], ["task:read"])).toBe(
      "createTask",
    );
  });

  test("denies an unmapped operation even with every scope", () => {
    expect(
      firstDeniedField(
        ["createApiToken"],
        ["task:read", "task:write", "project:write", "webhook:manage"],
      ),
    ).toBe("createApiToken");
  });

  test("always allows introspection meta-fields", () => {
    expect(firstDeniedField(["__schema", "__typename"], [])).toBeNull();
  });
});
