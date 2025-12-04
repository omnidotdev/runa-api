import { and, eq } from "drizzle-orm";
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

          const subscription = await payments.subscriptions.retrieve(
            event.data.object.id,
          );
          const tier = subscription.items.data[0].price.metadata
            .tier as SelectWorkspace["tier"];
          const workspaceId = subscription.metadata.workspaceId;

          if (subscription.status === "active") {
            await db
              .update(workspaceTable)
              .set({ tier, subscriptionId: subscription.id })
              .where(eq(workspaceTable.id, workspaceId));
          }

          break;
        }
        case "customer.subscription.updated": {
          if (event.data.object.metadata.omniProduct !== productName) break;

          const subscription = await payments.subscriptions.retrieve(
            event.data.object.id,
          );
          const workspaceId = subscription.metadata.workspaceId;

          if (subscription.status === "active") {
            const tier = subscription.items.data[0].price.metadata
              .tier as SelectWorkspace["tier"];

            await db
              .update(workspaceTable)
              .set({ tier })
              .where(
                and(
                  eq(workspaceTable.id, workspaceId),
                  eq(workspaceTable.subscriptionId, subscription.id),
                ),
              );
          }

          // NB: If the status of the subscription is deemed `unpaid`, we eagerly set the tier to `free` but keep the current subscription ID attached to the workspace.
          if (subscription.status === "unpaid") {
            await db
              .update(workspaceTable)
              .set({ tier: "free" })
              .where(
                and(
                  eq(workspaceTable.id, workspaceId),
                  eq(workspaceTable.subscriptionId, subscription.id),
                ),
              );
          }

          break;
        }
        case "customer.subscription.deleted": {
          if (event.data.object.metadata.omniProduct !== productName) break;

          const subscription = await payments.subscriptions.retrieve(
            event.data.object.id,
          );
          const workspaceId = subscription.metadata.workspaceId;

          if (subscription.status === "canceled") {
            await db
              .update(workspaceTable)
              .set({ tier: "free", subscriptionId: null })
              .where(
                and(
                  eq(workspaceTable.id, workspaceId),
                  eq(workspaceTable.subscriptionId, subscription.id),
                ),
              );
          }

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
