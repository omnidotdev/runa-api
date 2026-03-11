import { describe, expect, test } from "bun:test";

import {
  ALLOWED_EXECUTION_MODELS,
  ALLOWED_MODELS,
  isAllowedExecutionModel,
  isAllowedModel,
} from "../constants";

// ─────────────────────────────────────────────
// isAllowedExecutionModel
// ─────────────────────────────────────────────

describe("isAllowedExecutionModel", () => {
  test("returns true for anthropic/claude-sonnet-4.5", () => {
    expect(isAllowedExecutionModel("anthropic/claude-sonnet-4.5")).toBe(true);
  });

  test("returns true for anthropic/claude-opus-4.6", () => {
    expect(isAllowedExecutionModel("anthropic/claude-opus-4.6")).toBe(true);
  });

  test("returns false for anthropic/claude-haiku-4.5", () => {
    expect(isAllowedExecutionModel("anthropic/claude-haiku-4.5")).toBe(false);
  });

  test("returns false for unknown model", () => {
    expect(isAllowedExecutionModel("openai/gpt-4o")).toBe(false);
  });

  test("returns false for empty string", () => {
    expect(isAllowedExecutionModel("")).toBe(false);
  });

  test("ALLOWED_EXECUTION_MODELS has exactly 2 models", () => {
    expect(ALLOWED_EXECUTION_MODELS).toHaveLength(2);
  });
});

// ─────────────────────────────────────────────
// isAllowedModel
// ─────────────────────────────────────────────

describe("isAllowedModel", () => {
  test("returns true for all allowed models", () => {
    for (const model of ALLOWED_MODELS) {
      expect(isAllowedModel(model)).toBe(true);
    }
  });

  test("returns false for unknown model", () => {
    expect(isAllowedModel("unknown/model")).toBe(false);
  });

  test("returns false for empty string", () => {
    expect(isAllowedModel("")).toBe(false);
  });

  test("includes Anthropic models", () => {
    expect(isAllowedModel("anthropic/claude-sonnet-4.5")).toBe(true);
    expect(isAllowedModel("anthropic/claude-opus-4.6")).toBe(true);
    expect(isAllowedModel("anthropic/claude-haiku-4.5")).toBe(true);
  });

  test("includes OpenAI models", () => {
    expect(isAllowedModel("openai/gpt-4o")).toBe(true);
    expect(isAllowedModel("openai/gpt-4o-mini")).toBe(true);
  });

  test("includes Google models", () => {
    expect(isAllowedModel("google/gemini-2.0-flash-001")).toBe(true);
  });

  test("includes DeepSeek models", () => {
    expect(isAllowedModel("deepseek/deepseek-chat")).toBe(true);
  });

  test("includes Meta models", () => {
    expect(isAllowedModel("meta-llama/llama-3.3-70b-instruct")).toBe(true);
  });
});
