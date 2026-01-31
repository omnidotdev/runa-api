/**
 * Discovery state tracking for project creation AI.
 *
 * Tracks what facts have been learned during the discovery conversation
 * to avoid repetitive questions and know when we have enough to propose.
 */

/**
 * Facts that can be discovered during project creation conversation.
 */
export interface DiscoveryFacts {
  /** What the project is for (e.g., "mobile app", "marketing campaign") */
  purpose?: string;
  /** Description of the workflow (e.g., "ideation → design → review → publish") */
  workflow?: string;
  /** Team size or context (e.g., "solo", "small team", "large team") */
  teamContext?: string;
  /** What types of work need categorization (e.g., "bug vs feature", "priority levels") */
  categorizationNeeds?: string;
  /** Timeline or urgency (e.g., "urgent", "ongoing", "backlog") */
  timeline?: string;
  /** Specific domain or industry context */
  domain?: string;
  /** Any other relevant context learned */
  additionalContext?: string;
}

/**
 * Full discovery state stored in session metadata.
 */
export interface DiscoveryState {
  /** Facts discovered so far */
  facts: DiscoveryFacts;
  /** Number of discovery exchanges completed */
  exchangeCount: number;
  /** Whether we have enough info to propose */
  readyToPropose: boolean;
  /** Which facts were used in the last proposal (if any) */
  factsUsedInLastProposal?: (keyof DiscoveryFacts)[];
  /** Timestamp of last update */
  lastUpdated: string;
}

/** Required facts for a confident proposal. */
const REQUIRED_FACTS: (keyof DiscoveryFacts)[] = ["purpose", "workflow"];

/**
 * Create empty discovery state.
 */
export function createEmptyDiscoveryState(): DiscoveryState {
  return {
    facts: {},
    exchangeCount: 0,
    readyToPropose: false,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Check if we have learned enough to make a proposal.
 * Requires at minimum: purpose and workflow
 */
function shouldPropose(state: DiscoveryState): boolean {
  const hasRequired = REQUIRED_FACTS.every(
    (fact) => state.facts[fact] !== undefined && state.facts[fact] !== "",
  );
  return hasRequired;
}

/**
 * Get list of facts we still need to learn.
 */
export function getMissingFacts(
  state: DiscoveryState,
): (keyof DiscoveryFacts)[] {
  const missing: (keyof DiscoveryFacts)[] = [];

  for (const fact of REQUIRED_FACTS) {
    if (!state.facts[fact]) {
      missing.push(fact);
    }
  }

  return missing;
}

/**
 * Get list of facts we've already learned.
 */
export function getKnownFacts(
  state: DiscoveryState,
): Array<{ key: keyof DiscoveryFacts; value: string }> {
  const known: Array<{ key: keyof DiscoveryFacts; value: string }> = [];

  for (const [key, value] of Object.entries(state.facts)) {
    if (value && value.trim() !== "") {
      known.push({ key: key as keyof DiscoveryFacts, value });
    }
  }

  return known;
}

/**
 * Update discovery state with new facts.
 * Merges with existing facts (doesn't overwrite unless new value provided).
 */
export function updateDiscoveryState(
  currentState: DiscoveryState,
  newFacts: Partial<DiscoveryFacts>,
  incrementExchange = true,
): DiscoveryState {
  const updatedFacts: DiscoveryFacts = { ...currentState.facts };

  // Merge new facts (only set if value is provided)
  for (const [key, value] of Object.entries(newFacts)) {
    if (value !== undefined && value.trim() !== "") {
      updatedFacts[key as keyof DiscoveryFacts] = value;
    }
  }

  return {
    facts: updatedFacts,
    exchangeCount: incrementExchange
      ? currentState.exchangeCount + 1
      : currentState.exchangeCount,
    readyToPropose: shouldPropose({ ...currentState, facts: updatedFacts }),
    lastUpdated: new Date().toISOString(),
  };
}
