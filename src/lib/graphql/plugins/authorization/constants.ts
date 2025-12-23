import { BILLING_BYPASS_SLUGS } from "lib/config/env.config";

/**
 * Workspace slugs that bypass all billing/tier limits.
 * Configured via BILLING_BYPASS_SLUGS env var (comma-separated).
 * TODO: Replace with dynamic authZ plugin system
 */
const billingBypassSlugs: Set<string> = new Set(
  BILLING_BYPASS_SLUGS?.split(",")
    .map((s) => s.trim())
    .filter(Boolean) ?? [],
);

/**
 * Check if a workspace should bypass billing limits.
 */
export const isBillingExempt = (slug: string): boolean =>
  billingBypassSlugs.has(slug);

export const FREE_TIER_MAX_PROJECTS = 2;
export const FREE_TIER_MAX_TASKS = 500;
export const FREE_TIER_MAX_ASSIGNEES = 1;
export const FREE_TIER_MAX_COLUMNS = 5;
export const FREE_TIER_MAX_LABELS = 10;
export const FREE_TIER_MAX_MEMBERS = 3;
export const FREE_TIER_MAX_ADMINS = 1;

export const BASIC_TIER_MAX_PROJECTS = 10;
export const BASIC_TIER_MAX_TASKS = 2000;
export const BASIC_TIER_MAX_ASSIGNEES = 3;
export const BASIC_TIER_MAX_COLUMNS = 20;
export const BASIC_TIER_MAX_LABELS = 50;
export const BASIC_TIER_MAX_MEMBERS = 10;
export const BASIC_TIER_MAX_ADMINS = 3;
