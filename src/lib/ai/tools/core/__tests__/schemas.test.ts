import { describe, expect, test } from "bun:test";

import {
  commitChangesSchema,
  createPullRequestSchema,
  createTasksSchema,
  readFileSchema,
  runCommandSchema,
} from "../schemas";

// ─────────────────────────────────────────────
// createTasksSchema
// ─────────────────────────────────────────────

describe("createTasksSchema", () => {
  test("accepts valid input with one task", () => {
    const input = {
      tasks: [
        {
          title: "Implement auth",
          columnId: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
        },
      ],
    };

    const result = createTasksSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  test("accepts valid input with multiple tasks", () => {
    const input = {
      tasks: [
        {
          title: "Task 1",
          columnId: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
          description: "Some description",
          priority: "high" as const,
        },
        {
          title: "Task 2",
          columnId: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
        },
      ],
    };

    const result = createTasksSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  test("rejects empty tasks array", () => {
    const input = { tasks: [] };
    const result = createTasksSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  test("rejects more than 50 tasks", () => {
    const tasks = Array.from({ length: 51 }, (_, i) => ({
      title: `Task ${i}`,
      columnId: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    }));

    const result = createTasksSchema.safeParse({ tasks });
    expect(result.success).toBe(false);
  });

  test("rejects task without title", () => {
    const input = {
      tasks: [{ columnId: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11" }],
    };
    const result = createTasksSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  test("rejects task without columnId", () => {
    const input = { tasks: [{ title: "Test" }] };
    const result = createTasksSchema.safeParse(input);
    expect(result.success).toBe(false);
  });
});

// ─────────────────────────────────────────────
// readFileSchema
// ─────────────────────────────────────────────

describe("readFileSchema", () => {
  test("accepts valid input with defaults", () => {
    const result = readFileSchema.parse({ path: "src/index.ts" });
    expect(result.maxLines).toBe(200);
  });

  test("accepts custom maxLines", () => {
    const result = readFileSchema.parse({
      path: "src/index.ts",
      maxLines: 500,
    });
    expect(result.maxLines).toBe(500);
  });

  test("rejects maxLines over 500", () => {
    const result = readFileSchema.safeParse({
      path: "src/index.ts",
      maxLines: 501,
    });
    expect(result.success).toBe(false);
  });

  test("accepts startLine parameter", () => {
    const result = readFileSchema.parse({
      path: "src/index.ts",
      startLine: 10,
    });
    expect(result.startLine).toBe(10);
  });
});

// ─────────────────────────────────────────────
// runCommandSchema
// ─────────────────────────────────────────────

describe("runCommandSchema", () => {
  test("accepts valid command with default timeout", () => {
    const result = runCommandSchema.parse({ command: "ls -la" });
    expect(result.timeoutMs).toBe(30_000);
  });

  test("rejects timeout below 1000ms", () => {
    const result = runCommandSchema.safeParse({
      command: "ls",
      timeoutMs: 500,
    });
    expect(result.success).toBe(false);
  });

  test("rejects timeout above 120000ms", () => {
    const result = runCommandSchema.safeParse({
      command: "ls",
      timeoutMs: 120_001,
    });
    expect(result.success).toBe(false);
  });

  test("accepts timeout at lower bound", () => {
    const result = runCommandSchema.parse({ command: "ls", timeoutMs: 1000 });
    expect(result.timeoutMs).toBe(1000);
  });

  test("accepts timeout at upper bound", () => {
    const result = runCommandSchema.parse({
      command: "ls",
      timeoutMs: 120_000,
    });
    expect(result.timeoutMs).toBe(120_000);
  });
});

// ─────────────────────────────────────────────
// commitChangesSchema
// ─────────────────────────────────────────────

describe("commitChangesSchema", () => {
  test("accepts commit with message only", () => {
    const result = commitChangesSchema.parse({ message: "fix: resolve bug" });
    expect(result.files).toBeUndefined();
  });

  test("accepts commit with optional files array", () => {
    const result = commitChangesSchema.parse({
      message: "feat: add feature",
      files: ["src/index.ts", "src/lib/utils.ts"],
    });
    expect(result.files).toHaveLength(2);
  });
});

// ─────────────────────────────────────────────
// createPullRequestSchema
// ─────────────────────────────────────────────

describe("createPullRequestSchema", () => {
  test("accepts valid PR input", () => {
    const result = createPullRequestSchema.parse({
      title: "feat: add auth",
      body: "Implements authentication flow",
    });
    expect(result.title).toBe("feat: add auth");
    expect(result.body).toBe("Implements authentication flow");
  });

  test("rejects missing title", () => {
    const result = createPullRequestSchema.safeParse({
      body: "Some description",
    });
    expect(result.success).toBe(false);
  });

  test("rejects missing body", () => {
    const result = createPullRequestSchema.safeParse({ title: "feat: test" });
    expect(result.success).toBe(false);
  });
});
