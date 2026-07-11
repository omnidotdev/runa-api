import { describe, expect, it } from "bun:test";

import {
  MODERATION_BLOCK_SCORE,
  parseModerationResponse,
  shouldBlock,
} from "lib/moderation";

describe("parseModerationResponse", () => {
  it("maps the Say Less result shape (score, categories, matched terms)", () => {
    const result = parseModerationResponse({
      result: {
        flagged: true,
        score: 0.87,
        categories: ["toxicity", "profanity"],
        matched_terms: [
          { term: "slur", severity: "high", category: "hate_speech" },
        ],
      },
    });

    expect(result.flagged).toBe(true);
    expect(result.score).toBeCloseTo(0.87);
    expect(result.categories).toEqual(["toxicity", "profanity"]);
    expect(result.matchedTerms).toEqual(["slur"]);
  });

  it("defaults every field for an empty or malformed payload", () => {
    expect(parseModerationResponse(null)).toEqual({
      flagged: false,
      score: 0,
      categories: [],
      matchedTerms: [],
    });
  });
});

describe("shouldBlock", () => {
  const base = { flagged: true, score: 0, categories: [], matchedTerms: [] };

  it("does not block a benign mid-band ML flag (the D-U-N-S false positive)", () => {
    // Say Less flags at 0.5 and scored "D-U-N-S" at ~0.70, a false positive
    expect(
      shouldBlock({ ...base, score: 0.703, categories: ["toxicity"] }),
    ).toBe(false);
  });

  it("blocks any explicit wordlist match regardless of score", () => {
    expect(shouldBlock({ ...base, score: 0.2, matchedTerms: ["slur"] })).toBe(
      true,
    );
  });

  it("blocks a high-confidence ML-only flag", () => {
    expect(shouldBlock({ ...base, score: MODERATION_BLOCK_SCORE })).toBe(true);
    expect(shouldBlock({ ...base, score: 0.99 })).toBe(true);
  });

  it("does not block clean content", () => {
    expect(shouldBlock({ ...base, flagged: false, score: 0.01 })).toBe(false);
  });
});
