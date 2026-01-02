// biome-ignore-all lint/suspicious/noConsole: CLI script with intentional logging
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { DATABASE_URL, ENTITLEMENTS_BASE_URL } from "lib/config/env.config";
import { workspaceTable } from "lib/db/schema";

const BILLING_GRAPHQL_URL = `${ENTITLEMENTS_BASE_URL?.replace(/\/$/, "")}/graphql`;

interface CreateBillingAccountResponse {
  data?: {
    createBillingAccount?: {
      billingAccount: {
        id: string;
      };
    };
  };
  errors?: Array<{ message: string }>;
}

/**
 * Create a billing account for a workspace.
 */
const createBillingAccount = async (
  entityType: string,
  entityId: string,
  accountType: "individual" | "team" | "enterprise" = "team",
): Promise<string | null> => {
  const mutation = `
    mutation CreateBillingAccount($input: CreateBillingAccountInput!) {
      createBillingAccount(input: $input) {
        billingAccount {
          id
        }
      }
    }
  `;

  try {
    const response = await fetch(BILLING_GRAPHQL_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: mutation,
        variables: {
          input: {
            billingAccount: {
              entityType,
              entityId,
              accountType,
              provider: "stripe",
            },
          },
        },
      }),
    });

    const result = (await response.json()) as CreateBillingAccountResponse;

    if (result.errors?.length) {
      console.error(
        `  Error creating billing account: ${result.errors[0].message}`,
      );
      return null;
    }

    return result.data?.createBillingAccount?.billingAccount?.id ?? null;
  } catch (err) {
    console.error(`  Network error creating billing account:`, err);
    return null;
  }
};

/**
 * Create default tier entitlements for a billing account.
 */
const createTierEntitlements = async (
  billingAccountId: string,
  tier: "free" | "basic" | "team",
): Promise<boolean> => {
  const mutation = `
    mutation CreateEntitlement($input: CreateEntitlementInput!) {
      createEntitlement(input: $input) {
        entitlement {
          id
        }
      }
    }
  `;

  try {
    const response = await fetch(BILLING_GRAPHQL_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: mutation,
        variables: {
          input: {
            entitlement: {
              billingAccountId,
              productId: "runa",
              featureKey: "tier",
              value: tier,
              source: "MANUAL",
            },
          },
        },
      }),
    });

    const result = await response.json();

    if (result.errors?.length) {
      console.error(
        `  Error creating entitlement: ${result.errors[0].message}`,
      );
      return false;
    }

    return true;
  } catch (err) {
    console.error(`  Network error creating entitlement:`, err);
    return false;
  }
};

/**
 * Sync all workspaces to billing service.
 * Creates billing accounts and sets up initial tier entitlements.
 */
const syncWorkspacesToBilling = async () => {
  if (!DATABASE_URL) {
    console.error("DATABASE_URL not set");
    process.exit(1);
  }

  if (!ENTITLEMENTS_BASE_URL) {
    console.error("ENTITLEMENTS_BASE_URL not set");
    process.exit(1);
  }

  const pool = new Pool({ connectionString: DATABASE_URL });
  const db = drizzle({ client: pool, casing: "snake_case" });

  console.log("Syncing workspaces to billing service...");
  console.log(`Billing URL: ${BILLING_GRAPHQL_URL}`);

  // Get all workspaces
  const workspaces = await db.select().from(workspaceTable);

  console.log(`Found ${workspaces.length} workspaces`);

  let created = 0;
  let skipped = 0;
  let failed = 0;

  for (const workspace of workspaces) {
    console.log(`\nProcessing workspace: ${workspace.slug} (${workspace.id})`);

    // Skip if already has billing account
    if (workspace.billingAccountId) {
      console.log(
        `  Already linked to billing account: ${workspace.billingAccountId}`,
      );
      skipped++;
      continue;
    }

    // Create billing account
    const billingAccountId = await createBillingAccount(
      "workspace",
      workspace.id,
      "team",
    );

    if (!billingAccountId) {
      console.log(`  Failed to create billing account`);
      failed++;
      continue;
    }

    console.log(`  Created billing account: ${billingAccountId}`);

    // Create tier entitlement based on current tier
    const entitlementCreated = await createTierEntitlements(
      billingAccountId,
      workspace.tier,
    );

    if (!entitlementCreated) {
      console.log(`  Warning: Failed to create tier entitlement`);
    } else {
      console.log(`  Created tier entitlement: ${workspace.tier}`);
    }

    // Update workspace with billing account ID
    await db
      .update(workspaceTable)
      .set({ billingAccountId })
      .where(eq(workspaceTable.id, workspace.id));

    console.log(`  Updated workspace with billingAccountId`);
    created++;
  }

  console.log("\n--- Summary ---");
  console.log(`Created: ${created}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Failed: ${failed}`);

  await pool.end();
};

await syncWorkspacesToBilling()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
