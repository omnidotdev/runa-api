import { describe, expect, test } from "bun:test";

import { toolRegistry } from "../registry";

import type { ToolCategory, ToolEntity } from "../registry";

const EXPECTED_TOOLS = [
  "getTask",
  "queryTasks",
  "queryProject",
  "createTasks",
  "updateTasks",
  "createColumns",
  "updateColumns",
  "createComments",
  "deleteTasks",
  "deleteColumns",
  "delegateToAgent",
  "proposeProject",
  "createProjectFromProposal",
];

const VALID_CATEGORIES: ToolCategory[] = [
  "query",
  "write",
  "destructive",
  "delegation",
  "projectCreation",
];

const VALID_ENTITIES: (ToolEntity | null)[] = [
  "task",
  "column",
  "label",
  "comment",
  "project",
  null,
];

describe("toolRegistry", () => {
  test("contains all expected tool names", () => {
    const registryKeys = Object.keys(toolRegistry);
    for (const tool of EXPECTED_TOOLS) {
      expect(registryKeys).toContain(tool);
    }
  });

  test("has no unexpected tools", () => {
    const registryKeys = Object.keys(toolRegistry);
    for (const key of registryKeys) {
      expect(EXPECTED_TOOLS).toContain(key);
    }
  });

  test("each tool has a valid category", () => {
    for (const [, meta] of Object.entries(toolRegistry)) {
      expect(VALID_CATEGORIES).toContain(meta.category);
    }
  });

  test("each tool has a valid entity or null", () => {
    for (const [, meta] of Object.entries(toolRegistry)) {
      expect(VALID_ENTITIES).toContain(meta.entity);
    }
  });

  test("no duplicate tool names", () => {
    const keys = Object.keys(toolRegistry);
    const uniqueKeys = new Set(keys);
    expect(uniqueKeys.size).toBe(keys.length);
  });

  test("query tools have correct category", () => {
    expect(toolRegistry.getTask.category).toBe("query");
    expect(toolRegistry.queryTasks.category).toBe("query");
    expect(toolRegistry.queryProject.category).toBe("query");
  });

  test("destructive tools have correct category", () => {
    expect(toolRegistry.deleteTasks.category).toBe("destructive");
    expect(toolRegistry.deleteColumns.category).toBe("destructive");
  });

  test("delegation tool has null entity", () => {
    expect(toolRegistry.delegateToAgent.entity).toBeNull();
  });
});
