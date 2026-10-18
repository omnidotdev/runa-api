/**
 * Pure unit tests for the API-token scope vocabulary + default-deny check.
 */

import { describe, expect, test } from "bun:test";

import {
  API_SCOPES,
  invalidScopes,
  isValidScope,
  operationPermittedByScopes,
  requiredScopeForOperation,
  tokenScopePermits,
} from "lib/tokens/scopes";

describe("isValidScope / invalidScopes", () => {
  test("accepts every canonical scope", () => {
    for (const scope of API_SCOPES) {
      expect(isValidScope(scope)).toBe(true);
    }
    expect(invalidScopes([...API_SCOPES])).toEqual([]);
  });

  test("an empty grant is valid", () => {
    expect(invalidScopes([])).toEqual([]);
  });

  test("reports unknown scopes", () => {
    expect(isValidScope("task:delete")).toBe(false);
    expect(invalidScopes(["task:read", "bogus", "task:delete"])).toEqual([
      "bogus",
      "task:delete",
    ]);
  });
});

describe("tokenScopePermits (default-deny)", () => {
  test("permits only an explicitly granted scope", () => {
    expect(tokenScopePermits(["task:read"], "task:read")).toBe(true);
    expect(tokenScopePermits(["task:read"], "task:write")).toBe(false);
  });

  test("denies when nothing is granted", () => {
    expect(tokenScopePermits([], "task:read")).toBe(false);
  });

  test("denies an operation with no required scope (unmapped)", () => {
    expect(tokenScopePermits(["task:read", "task:write"], null)).toBe(false);
    expect(tokenScopePermits(API_SCOPES, undefined)).toBe(false);
  });
});

describe("operation -> scope map (default-deny)", () => {
  test("maps core operations to their scope", () => {
    expect(requiredScopeForOperation("createTask")).toBe("task:write");
    expect(requiredScopeForOperation("tasks")).toBe("task:read");
    expect(requiredScopeForOperation("moveTask")).toBe("task:write");
    expect(requiredScopeForOperation("deleteWebhookEndpoint")).toBe(
      "webhook:manage",
    );
  });

  test("account/token administration is unmapped (closed to tokens)", () => {
    for (const field of [
      "createApiToken",
      "revokeApiToken",
      "createUser",
      "deleteUserById",
      "createMyCalendarFeedToken",
      "updateSetting",
    ]) {
      expect(requiredScopeForOperation(field)).toBeNull();
      // even a token holding every scope cannot reach an unmapped operation
      expect(operationPermittedByScopes(field, API_SCOPES)).toBe(false);
    }
  });

  test("permits a mapped operation only with its granted scope", () => {
    expect(operationPermittedByScopes("createTask", ["task:write"])).toBe(true);
    expect(operationPermittedByScopes("createTask", ["task:read"])).toBe(false);
    expect(operationPermittedByScopes("tasks", ["task:read"])).toBe(true);
    expect(operationPermittedByScopes("createProject", [])).toBe(false);
  });
});
