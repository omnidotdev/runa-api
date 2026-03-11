import { afterEach, describe, expect, mock, test } from "bun:test";

// Mock the db module
const mockInsertValues = mock(() => ({
  catch: mock(() => {}),
}));
const mockInsert = mock(() => ({
  values: mockInsertValues,
}));

mock.module("lib/db/db", () => ({
  dbPool: {
    insert: mockInsert,
  },
}));

mock.module("lib/db/schema", () => ({
  agentActivities: { name: "agent_activity" },
}));

const { logActivity } = await import("../withActivityLogging");

const baseContext = {
  projectId: "proj-1",
  organizationId: "org-1",
  userId: "user-1",
  accessToken: "token",
  sessionId: "session-1",
};

describe("logActivity", () => {
  afterEach(() => {
    mockInsert.mockClear();
    mockInsertValues.mockClear();
  });

  test("inserts correct activity record", () => {
    logActivity({
      context: baseContext,
      toolName: "createTasks",
      toolInput: { tasks: [{ title: "Test" }] },
      toolOutput: { createdCount: 1 },
      status: "completed",
      affectedTaskIds: ["task-1"],
    });

    expect(mockInsert).toHaveBeenCalledTimes(1);
    expect(mockInsertValues).toHaveBeenCalledTimes(1);

    const values = (
      mockInsertValues.mock.calls as unknown as unknown[][]
    )[0]![0] as Record<string, unknown>;
    expect(values).toMatchObject({
      organizationId: "org-1",
      projectId: "proj-1",
      sessionId: "session-1",
      userId: "user-1",
      toolName: "createTasks",
      status: "completed",
      affectedTaskIds: ["task-1"],
    });
  });

  test("defaults optional fields", () => {
    logActivity({
      context: baseContext,
      toolName: "queryTasks",
      toolInput: {},
      status: "completed",
    });

    const values = (
      mockInsertValues.mock.calls as unknown as unknown[][]
    )[0]![0] as Record<string, unknown>;
    expect(values.toolOutput).toBeNull();
    expect(values.requiresApproval).toBe(false);
    expect(values.approvalStatus).toBeNull();
    expect(values.errorMessage).toBeNull();
    expect(values.affectedTaskIds).toEqual([]);
    expect(values.snapshotBefore).toBeNull();
  });

  test("does not throw on DB error (fire-and-forget)", () => {
    // biome-ignore lint/suspicious/noExplicitAny: mock override needs flexible typing
    (mockInsert as any).mockImplementationOnce(() => ({
      values: mock(() => ({
        catch: mock((handler: (err: Error) => void) => {
          handler(new Error("DB connection failed"));
        }),
      })),
    }));

    // Should not throw
    expect(() => {
      logActivity({
        context: baseContext,
        toolName: "createTasks",
        toolInput: {},
        status: "completed",
      });
    }).not.toThrow();
  });

  test("includes snapshot when provided", () => {
    const snapshot = { title: "Old Title", priority: "low" };

    logActivity({
      context: baseContext,
      toolName: "updateTasks",
      toolInput: {},
      status: "completed",
      snapshotBefore: snapshot,
    });

    const values = (
      mockInsertValues.mock.calls as unknown as unknown[][]
    )[0]![0] as Record<string, unknown>;
    expect(values.snapshotBefore).toEqual(snapshot);
  });
});
