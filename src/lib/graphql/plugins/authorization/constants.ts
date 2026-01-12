import { BILLING_BYPASS_ORG_IDS } from "lib/config/env.config";

/**
 * Organization IDs that bypass all billing/tier limits.
 * Configured via BILLING_BYPASS_ORG_IDS env var (comma-separated).
 *
 * NOTE: Exported as array for use in EXPORTABLE functions.
 * Use `billingBypassOrgIds.includes(organizationId)` inline within EXPORTABLE blocks.
 */
export const billingBypassOrgIds: string[] =
  BILLING_BYPASS_ORG_IDS?.split(",")
    .map((s) => s.trim())
    .filter(Boolean) ?? [];

/**
 * Feature keys for entitlement queries.
 * These map to entitlement feature keys in the billing service.
 */
export const FEATURE_KEYS = {
  TIER: "tier",
  MAX_PROJECTS: "max_projects",
  MAX_TASKS: "max_tasks",
  MAX_COLUMNS: "max_columns",
  MAX_LABELS: "max_labels",
  MAX_ASSIGNEES: "max_assignees",
  MAX_MEMBERS: "max_members",
  MAX_ADMINS: "max_admins",
} as const;
