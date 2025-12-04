import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";

import app from "lib/config/app.config";
import { STRIPE_WEBHOOK_SECRET } from "lib/config/env.config";
import { dbPool as db } from "lib/db/db";
import { workspaceTable } from "lib/db/schema";
import payments from "lib/payments";

import type { SelectWorkspace } from "lib/db/schema";

export const webhooks = new Elysia({ prefix: "/webhooks" }).post(
  "/stripe",
  async ({ request, headers, status }) => {
    const productName = app.name.toLowerCase();
    const signature = headers["stripe-signature"];

    if (!signature) return status(400, "Missing signature");

    try {
      const body = await request.text();

      const event = await payments.webhooks.constructEventAsync(
        body,
        signature,
        STRIPE_WEBHOOK_SECRET as string,
      );

      switch (event.type) {
        case "customer.subscription.created": {
          if (event.data.object.metadata.omniProduct !== productName) break;

          const price = event.data.object.items.data[0].price;

          const workspaceId = event.data.object.metadata.workspaceId;
          const subscriptionId = event.data.object.id;
          const tier = price.metadata.tier as SelectWorkspace["tier"];

          await db
            .update(workspaceTable)
            .set({ tier, subscriptionId })
            .where(eq(workspaceTable.id, workspaceId));

          break;
        }
        case "customer.subscription.updated": {
          if (event.data.object.metadata.omniProduct !== productName) break;

          const price = event.data.object.items.data[0].price;
          const workspaceId = event.data.object.metadata.workspaceId;

          if (
            event.data.object.status === "active" &&
            event.data.previous_attributes?.items
          ) {
            const previousTier =
              event.data.previous_attributes.items.data[0].price.metadata.tier;
            const currentTier = price.metadata.tier;

            if (previousTier !== currentTier) {
              await db
                .update(workspaceTable)
                .set({ tier: currentTier as SelectWorkspace["tier"] })
                .where(eq(workspaceTable.id, workspaceId));
            }
          }

          // NB: If the status of the subscription is deemed `unpaid`, we eagerly set the tier to `free` but keep the current subscription ID attached to the workspace.
          if (event.data.object.status === "unpaid") {
            await db
              .update(workspaceTable)
              .set({ tier: "free" })
              .where(eq(workspaceTable.id, workspaceId));
          }

          break;
        }
        case "customer.subscription.deleted": {
          if (event.data.object.metadata.omniProduct !== productName) break;

          const workspaceId = event.data.object.metadata.workspaceId;

          await db
            .update(workspaceTable)
            .set({ tier: "free", subscriptionId: null })
            .where(eq(workspaceTable.id, workspaceId));

          break;
        }
        default:
          break;
      }

      return status(200, "Webhook event consumed");
    } catch (err) {
      console.error(err);
      return status(500, "Internal Server Error");
    }
  },
  {
    headers: t.Object({
      "stripe-signature": t.String(),
    }),
  },
);
