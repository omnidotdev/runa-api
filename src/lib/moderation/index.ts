/**
 * Content moderation via Say Less.
 *
 * Thin, swappable provider: with no `SAY_LESS_URL`, moderation is a noop that
 * allows everything; when configured, content is checked against the Say Less
 * `/check` endpoint and blockable content is rejected. Failures fail OPEN
 * (allow) so an outage never blocks legitimate input.
 *
 * Say Less returns both a deterministic wordlist signal (`matchedTerms`) and a
 * probabilistic ML toxicity `score`. It flags at 0.5, but that ML classifier
 * false-positives on short/benign strings in the mid band (e.g. the business
 * identifier "D-U-N-S" scored ~0.70), so runa does not treat the raw `flagged`
 * boolean as a block. `shouldBlock` is the runa policy that decides.
 */

import { EXPORTABLE } from "graphile-export";

import { SAY_LESS_URL } from "lib/config/env.config";

interface ModerationResult {
  /** Provider's own flag decision (ML score > 0.5 OR any wordlist hit). */
  flagged: boolean;
  /** ML toxicity confidence in [0,1]; 0 when moderation is disabled. */
  score: number;
  /** Detected categories (e.g. toxicity, profanity); empty when clean. */
  categories: string[];
  /** Explicit wordlist/blacklist term hits; empty for pure ML flags. */
  matchedTerms: string[];
}

/**
 * Score at or above which a pure ML flag (no wordlist hit) is trusted enough to
 * block. Below this, runa defers to the deterministic wordlist and lets the
 * noisy mid band through, so benign text the classifier misreads is not
 * rejected. Kept high on purpose (real slurs/profanity are caught by the
 * wordlist regardless of score).
 */
export const MODERATION_BLOCK_SCORE = 0.9;

const asStringArray = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];

/** Parse the Say Less `/check` response (`{ result: FilterResult }`). */
export const parseModerationResponse = (payload: unknown): ModerationResult => {
  const result = (
    payload as {
      result?: {
        flagged?: unknown;
        score?: unknown;
        categories?: unknown;
        matched_terms?: unknown;
      };
    } | null
  )?.result;

  return {
    flagged: Boolean(result?.flagged),
    score: typeof result?.score === "number" ? result.score : 0,
    categories: asStringArray(result?.categories),
    matchedTerms: Array.isArray(result?.matched_terms)
      ? result.matched_terms
          .map((match) =>
            typeof match === "string"
              ? match
              : (match as { term?: unknown })?.term,
          )
          .filter((term): term is string => typeof term === "string")
      : [],
  };
};

/**
 * Runa's block policy over a provider result: always block explicit wordlist
 * hits (high precision, real slurs/profanity), and block ML-only flags only at
 * high confidence (`MODERATION_BLOCK_SCORE`). This keeps genuinely abusive
 * content out while not blocking benign business text the ML classifier
 * misreads in its noisy mid band.
 */
export const shouldBlock = EXPORTABLE(
  (MODERATION_BLOCK_SCORE) =>
    (result: ModerationResult): boolean =>
      result.matchedTerms.length > 0 || result.score >= MODERATION_BLOCK_SCORE,
  [MODERATION_BLOCK_SCORE],
);

const CLEAN_RESULT: ModerationResult = {
  flagged: false,
  score: 0,
  categories: [],
  matchedTerms: [],
};

/**
 * Check text against the moderation provider. Returns a clean result when
 * moderation is disabled or the provider errors (fail open).
 */
export const moderateText = async (text: string): Promise<ModerationResult> => {
  if (!SAY_LESS_URL || !text.trim()) return CLEAN_RESULT;

  try {
    const response = await fetch(`${SAY_LESS_URL}/check`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (!response.ok) {
      console.error(
        `[Moderation] Say Less returned ${response.status}; allowing`,
      );
      return CLEAN_RESULT;
    }
    return parseModerationResponse(await response.json());
  } catch (error) {
    console.error("[Moderation] Check failed; allowing:", error);
    return CLEAN_RESULT;
  }
};
