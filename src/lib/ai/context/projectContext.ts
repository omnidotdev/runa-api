/**
 * Smart context management for project creation AI.
 *
 * Replaces raw project lists with intelligent summaries and
 * prioritizes relevant projects for better AI context.
 */

import { desc, eq } from "drizzle-orm";

import { dbPool } from "lib/db/db";
import { projects } from "lib/db/schema";

/** Summary of organization project context for AI prompts. */
export interface ProjectContextSummary {
  /** Total number of projects in organization. */
  totalCount: number;
  /** Human-readable summary of project patterns. */
  summary: string;
  /** Top 10 most relevant project names for reference. */
  recentProjects: string[];
  /** Pattern analysis of prefixes used. */
  prefixPatterns: {
    /** Most common prefix length (2, 3, 4 chars, etc.) */
    commonLength: number;
    /** Example prefixes found. */
    examples: string[];
  };
  /** Detected project categories/groups. */
  categories: Array<{
    name: string;
    count: number;
    examples: string[];
  }>;
}

/** Cache entry for context queries. */
interface CacheEntry {
  data: ProjectContextSummary;
  timestamp: number;
}

/** In-memory cache with 30-second TTL. */
const contextCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 30_000;

/**
 * Generate intelligent context summary for project creation.
 *
 * Instead of dumping all project names (causing context overflow),
 * this analyzes patterns and returns a concise summary + most relevant projects.
 */
export async function generateProjectContext(
  organizationId: string,
): Promise<ProjectContextSummary> {
  // Check cache first
  const cached = contextCache.get(organizationId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  // Query last 20 projects by update time (most relevant for context)
  const recentProjectsData = await dbPool
    .select({
      name: projects.name,
      prefix: projects.prefix,
      updatedAt: projects.updatedAt,
    })
    .from(projects)
    .where(eq(projects.organizationId, organizationId))
    .orderBy(desc(projects.updatedAt))
    .limit(20);

  // Get total count for summary
  const countResult = await dbPool
    .select({ count: count() })
    .from(projects)
    .where(eq(projects.organizationId, organizationId));

  const totalCount = countResult[0]?.count ?? 0;

  if (recentProjectsData.length === 0) {
    const emptyContext: ProjectContextSummary = {
      totalCount: 0,
      summary: "No existing projects in this organization.",
      recentProjects: [],
      prefixPatterns: { commonLength: 3, examples: [] },
      categories: [],
    };
    contextCache.set(organizationId, {
      data: emptyContext,
      timestamp: Date.now(),
    });
    return emptyContext;
  }

  // Analyze prefixes
  const prefixes = recentProjectsData
    .map((p) => p.prefix)
    .filter((p): p is string => p !== null && p.length > 0);

  const prefixPatterns = analyzePrefixPatterns(prefixes);

  // Categorize projects by name patterns
  const categories = categorizeProjects(recentProjectsData.map((p) => p.name));

  // Generate human-readable summary
  const summary = generateSummary(totalCount, categories, prefixPatterns);

  // Get top 10 most recent project names
  const recentProjects = recentProjectsData.slice(0, 10).map((p) => p.name);

  const context: ProjectContextSummary = {
    totalCount,
    summary,
    recentProjects,
    prefixPatterns,
    categories,
  };

  // Cache the result
  contextCache.set(organizationId, { data: context, timestamp: Date.now() });

  return context;
}

/**
 * Analyze prefix patterns to understand naming conventions.
 */
function analyzePrefixPatterns(
  prefixes: string[],
): ProjectContextSummary["prefixPatterns"] {
  if (prefixes.length === 0) {
    return { commonLength: 3, examples: [] };
  }

  // Count frequency of each prefix length
  const lengthCounts = new Map<number, number>();
  for (const prefix of prefixes) {
    const len = prefix.length;
    lengthCounts.set(len, (lengthCounts.get(len) ?? 0) + 1);
  }

  // Find most common length
  let commonLength = 3; // Default to 3-letter prefixes
  let maxCount = 0;
  for (const [length, count] of lengthCounts) {
    if (count > maxCount) {
      maxCount = count;
      commonLength = length;
    }
  }

  // Get unique examples (up to 5)
  const uniquePrefixes = [...new Set(prefixes)];
  const examples = uniquePrefixes.slice(0, 5);

  return { commonLength, examples };
}

/**
 * Categorize projects by detecting keywords in names.
 */
function categorizeProjects(
  projectNames: string[],
): ProjectContextSummary["categories"] {
  const categories = new Map<string, string[]>();

  // Define category patterns (keywords to match)
  const categoryPatterns: Array<{ name: string; keywords: string[] }> = [
    {
      name: "Development",
      keywords: [
        "dev",
        "api",
        "app",
        "web",
        "mobile",
        "backend",
        "frontend",
        "code",
        "software",
      ],
    },
    {
      name: "Marketing",
      keywords: [
        "marketing",
        "campaign",
        "content",
        "social",
        "mkt",
        "ads",
        "promo",
      ],
    },
    {
      name: "Design",
      keywords: ["design", "ui", "ux", "creative", "brand", "visual"],
    },
    {
      name: "Product",
      keywords: ["product", "feature", "roadmap", "release", "launch"],
    },
    {
      name: "Operations",
      keywords: ["ops", "internal", "admin", "process", "workflow"],
    },
    {
      name: "Personal",
      keywords: ["personal", "home", "private", "todo", "gtd"],
    },
  ];

  // Categorize each project
  for (const name of projectNames) {
    const lowerName = name.toLowerCase();
    let matched = false;

    for (const { name: catName, keywords } of categoryPatterns) {
      if (keywords.some((kw) => lowerName.includes(kw))) {
        const existing = categories.get(catName) ?? [];
        existing.push(name);
        categories.set(catName, existing);
        matched = true;
        break; // Only first match
      }
    }

    if (!matched) {
      // Add to "Other" category
      const existing = categories.get("Other") ?? [];
      existing.push(name);
      categories.set("Other", existing);
    }
  }

  // Convert to sorted array (by count, descending)
  const sortedCategories = [...categories.entries()]
    .sort((a, b) => b[1].length - a[1].length)
    .map(([name, projects]) => ({
      name,
      count: projects.length,
      examples: projects.slice(0, 3), // Top 3 examples per category
    }));

  return sortedCategories;
}

/**
 * Generate human-readable summary of project context.
 */
function generateSummary(
  totalCount: number,
  categories: ProjectContextSummary["categories"],
  prefixPatterns: ProjectContextSummary["prefixPatterns"],
): string {
  if (totalCount === 0) {
    return "No existing projects in this organization.";
  }

  const parts: string[] = [];

  // Total count
  parts.push(
    `Organization has ${totalCount} project${totalCount === 1 ? "" : "s"}`,
  );

  // Categories (if more than 1)
  if (categories.length > 1) {
    const topCategories = categories.slice(0, 3);
    const catDescriptions = topCategories.map(
      (c) =>
        `${c.count} ${c.name.toLowerCase()}${c.examples.length > 0 ? ` (${c.examples.slice(0, 2).join(", ")}...)` : ""}`,
    );
    parts.push(`: ${catDescriptions.join(", ")}`);
  } else if (categories.length === 1) {
    parts.push(`, all ${categories[0].name.toLowerCase()}`);
  }

  // Prefix patterns
  if (prefixPatterns.examples.length > 0) {
    parts.push(
      `. Uses ${prefixPatterns.commonLength}-letter prefixes: ${prefixPatterns.examples.join(", ")}`,
    );
  }

  return parts.join("");
}

import { count } from "drizzle-orm";
