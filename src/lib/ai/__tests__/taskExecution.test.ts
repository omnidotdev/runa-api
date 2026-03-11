import { describe, expect, test } from "bun:test";

import { extractPrInfo } from "../extractPrInfo";

// ─────────────────────────────────────────────
// extractPrInfo — pure function, no mocks needed
// ─────────────────────────────────────────────

describe("extractPrInfo", () => {
  test("returns null when result has no steps", () => {
    expect(extractPrInfo({ steps: [] })).toBeNull();
    expect(extractPrInfo({})).toBeNull();
  });

  test("returns null when no createPullRequest tool call exists", () => {
    const result = {
      steps: [
        {
          toolCalls: [
            { toolName: "commitChanges", toolCallId: "call-1" },
            { toolName: "writeFile", toolCallId: "call-2" },
          ],
          toolResults: [
            { toolCallId: "call-1", result: { committed: true } },
            { toolCallId: "call-2", result: { written: true } },
          ],
        },
      ],
    };

    expect(extractPrInfo(result)).toBeNull();
  });

  test("extracts prUrl and prNumber from matching tool result", () => {
    const result = {
      steps: [
        {
          toolCalls: [{ toolName: "commitChanges", toolCallId: "call-1" }],
          toolResults: [{ toolCallId: "call-1", result: { committed: true } }],
        },
        {
          toolCalls: [{ toolName: "createPullRequest", toolCallId: "call-2" }],
          toolResults: [
            {
              toolCallId: "call-2",
              result: {
                prUrl: "https://github.com/org/repo/pull/42",
                prNumber: 42,
              },
            },
          ],
        },
      ],
    };

    expect(extractPrInfo(result)).toEqual({
      prUrl: "https://github.com/org/repo/pull/42",
      prNumber: 42,
    });
  });

  test("returns null when createPullRequest has no matching result", () => {
    const result = {
      steps: [
        {
          toolCalls: [{ toolName: "createPullRequest", toolCallId: "call-1" }],
          toolResults: [],
        },
      ],
    };

    expect(extractPrInfo(result)).toBeNull();
  });

  test("returns null when result is missing prUrl", () => {
    const result = {
      steps: [
        {
          toolCalls: [{ toolName: "createPullRequest", toolCallId: "call-1" }],
          toolResults: [{ toolCallId: "call-1", result: { prNumber: 42 } }],
        },
      ],
    };

    expect(extractPrInfo(result)).toBeNull();
  });

  test("returns null when result is missing prNumber", () => {
    const result = {
      steps: [
        {
          toolCalls: [{ toolName: "createPullRequest", toolCallId: "call-1" }],
          toolResults: [
            {
              toolCallId: "call-1",
              result: { prUrl: "https://github.com/org/repo/pull/42" },
            },
          ],
        },
      ],
    };

    expect(extractPrInfo(result)).toBeNull();
  });

  test("finds PR info even in later steps", () => {
    const result = {
      steps: [
        { toolCalls: [], toolResults: [] },
        { toolCalls: [], toolResults: [] },
        {
          toolCalls: [{ toolName: "createPullRequest", toolCallId: "call-5" }],
          toolResults: [
            {
              toolCallId: "call-5",
              result: {
                prUrl: "https://github.com/org/repo/pull/99",
                prNumber: 99,
              },
            },
          ],
        },
      ],
    };

    expect(extractPrInfo(result)).toEqual({
      prUrl: "https://github.com/org/repo/pull/99",
      prNumber: 99,
    });
  });
});
