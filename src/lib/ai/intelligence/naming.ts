/**
 * Intelligent naming and prefix suggestions for project creation.
 *
 * Analyzes existing project patterns to suggest meaningful prefixes
 * that match organizational conventions and avoid conflicts.
 */

import type { ProjectContextSummary } from "../prompts/projectCreation";

/** Suggested prefix with reasoning. */
export interface PrefixSuggestion {
  /** The suggested prefix (uppercase). */
  prefix: string;
  /** Why this prefix was suggested. */
  reasoning: string;
  /** Confidence level (high/medium/low). */
  confidence: "high" | "medium" | "low";
}

/** Project type keywords for prefix generation. */
const PROJECT_TYPE_PREFIXES: Record<string, string[]> = {
  software: ["APP", "API", "DEV", "WEB", "MOB", "SFT", "SYS", "PLT"],
  mobile: ["MOB", "APP", "IOS", "AND", "MOBILE"],
  web: ["WEB", "WWW", "SITE", "APP", "FRONT"],
  marketing: ["MKT", "CMP", "ADS", "PROMO", "CONTENT"],
  design: ["DSG", "UX", "UI", "CREATIVE", "VISUAL"],
  product: ["PRD", "FEAT", "PROD", "ITEM"],
  operations: ["OPS", "PROC", "WORK", "ADMIN"],
  personal: ["PRS", "ME", "TODO", "PERSONAL"],
  default: ["PRJ", "NEW", "WORK"],
};

/**
 * Generate prefix suggestions based on project context and type.
 */
export function generatePrefixSuggestions(
  context: ProjectContextSummary,
  projectType?: string,
  projectName?: string,
): PrefixSuggestion[] {
  const suggestions: PrefixSuggestion[] = [];
  const existingPrefixes = new Set(context.prefixPatterns.examples);
  const targetLength = context.prefixPatterns.commonLength;

  // 1. Try to extract from project name
  if (projectName) {
    const namePrefix = extractPrefixFromName(projectName, targetLength);
    if (namePrefix && !existingPrefixes.has(namePrefix)) {
      suggestions.push({
        prefix: namePrefix,
        reasoning: `Derived from project name "${projectName}"`,
        confidence: "high",
      });
    }
  }

  // 2. Use project type to suggest appropriate prefixes
  const typeKey = detectProjectType(projectType, projectName);
  const typePrefixes =
    PROJECT_TYPE_PREFIXES[typeKey] ?? PROJECT_TYPE_PREFIXES.default;

  for (const prefix of typePrefixes) {
    // Adjust to match org convention
    const adjustedPrefix = adjustPrefixLength(prefix, targetLength);

    if (!existingPrefixes.has(adjustedPrefix)) {
      // Check if similar prefix exists
      const similar = findSimilarPrefix(adjustedPrefix, existingPrefixes);

      if (!similar) {
        suggestions.push({
          prefix: adjustedPrefix,
          reasoning: `Matches your ${targetLength}-letter convention for ${typeKey} projects`,
          confidence: "medium",
        });
      }
    }

    // Limit suggestions
    if (suggestions.length >= 3) break;
  }

  // 3. Generate fallback based on org pattern
  if (suggestions.length === 0) {
    const fallback = generateFallbackPrefix(existingPrefixes, targetLength);
    suggestions.push({
      prefix: fallback,
      reasoning: `Follows your ${targetLength}-letter prefix convention`,
      confidence: "low",
    });
  }

  return suggestions.slice(0, 3);
}

/**
 * Extract potential prefix from project name.
 */
function extractPrefixFromName(
  name: string,
  targetLength: number,
): string | null {
  // Get first letters of each word
  const words = name.split(/\s+/);
  if (words.length === 1) {
    // Single word - take first N letters
    return words[0].slice(0, targetLength).toUpperCase();
  }

  // Multiple words - take first letter of each word
  const initials = words
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  return initials
    .slice(0, targetLength)
    .padEnd(targetLength, initials[0] || "X");
}

/**
 * Detect project type from description or name.
 */
function detectProjectType(type?: string, name?: string): string {
  const text = `${type || ""} ${name || ""}`.toLowerCase();

  const typePatterns: Array<{ key: string; patterns: string[] }> = [
    { key: "mobile", patterns: ["mobile", "app", "ios", "android", "phone"] },
    { key: "web", patterns: ["web", "website", "frontend", "front-end"] },
    { key: "software", patterns: ["software", "dev", "development", "system"] },
    {
      key: "marketing",
      patterns: ["marketing", "campaign", "content", "promo"],
    },
    { key: "design", patterns: ["design", "ui", "ux", "creative", "visual"] },
    { key: "product", patterns: ["product", "feature"] },
    {
      key: "operations",
      patterns: ["operations", "ops", "process", "workflow"],
    },
    { key: "personal", patterns: ["personal", "todo", "private"] },
  ];

  for (const { key, patterns } of typePatterns) {
    if (patterns.some((p) => text.includes(p))) {
      return key;
    }
  }

  return "default";
}

/**
 * Adjust prefix length to match organization convention.
 */
function adjustPrefixLength(prefix: string, targetLength: number): string {
  if (prefix.length === targetLength) return prefix;

  if (prefix.length < targetLength) {
    // Pad with last character
    return prefix.padEnd(targetLength, prefix[prefix.length - 1] || "X");
  }

  // Truncate
  return prefix.slice(0, targetLength);
}

/**
 * Find if a similar prefix already exists.
 */
function findSimilarPrefix(
  prefix: string,
  existing: Set<string>,
): string | null {
  for (const existingPrefix of existing) {
    // Check if they're the same (case insensitive already handled by Set)
    if (existingPrefix === prefix) return existingPrefix;

    // Check Levenshtein distance for similar prefixes
    if (levenshteinDistance(prefix, existingPrefix) <= 1) {
      return existingPrefix;
    }
  }
  return null;
}

/**
 * Calculate Levenshtein distance between two strings.
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j] + 1, // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Generate a fallback prefix when no good suggestions found.
 */
function generateFallbackPrefix(
  existing: Set<string>,
  targetLength: number,
): string {
  const candidates = ["NEW", "PRJ", "WORK", "PROJ", "TASK"];

  for (const candidate of candidates) {
    const adjusted = adjustPrefixLength(candidate, targetLength);
    if (!existing.has(adjusted)) {
      return adjusted;
    }
  }

  // Generate random-ish prefix
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let attempts = 0;
  while (attempts < 100) {
    let prefix = "";
    for (let i = 0; i < targetLength; i++) {
      prefix += chars[Math.floor(Math.random() * chars.length)];
    }
    if (!existing.has(prefix)) {
      return prefix;
    }
    attempts++;
  }

  // Last resort with timestamp
  return `PRJ${Date.now().toString().slice(-2)}`.slice(0, targetLength);
}
