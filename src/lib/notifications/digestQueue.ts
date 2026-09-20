/**
 * Assignment-email digest queue.
 *
 * Buffers assignment notifications for users whose cadence is "digest" and sends
 * one grouped email per window. The poller claims due rows with FOR UPDATE SKIP
 * LOCKED so multiple API replicas never send the same digest twice (unlike the
 * warden sync poller, whose operations are idempotent, an email is not). Send
 * failures keep the rows for the next poll; a noop provider (Herald unconfigured)
 * drops them, matching the immediate path
 */

import { dbPool, pgPool } from "lib/db/db";
import { notificationDigestQueue } from "lib/db/schema";
import { buildTasksAssignedDigestEmail } from "lib/notifications/templates/tasksAssignedDigest";
import { notifications } from "lib/providers";

import type { EmailParams } from "@omnidotdev/providers";
import type { DigestTaskItem } from "lib/notifications/templates/tasksAssignedDigest";

/** How long assignments accumulate before a digest goes out */
const DIGEST_WINDOW_MS = 5 * 60 * 1_000;

/** How often the poller checks for due digests */
const POLL_INTERVAL_MS = 60_000;

/** Max rows claimed per poll cycle */
const POLL_BATCH_SIZE = 200;

let pollTimer: ReturnType<typeof setInterval> | null = null;

/** The digest line data stored per queued assignment. */
interface DigestPayload extends DigestTaskItem {
  /** Recipient email address */
  to: string;
  /** Manage-notifications link for the footer, or null */
  manageUrl: string | null;
}

/** Queue an assignment for the recipient's next digest window. */
export const enqueueAssignmentDigest = async (
  userId: string,
  payload: DigestPayload,
): Promise<void> => {
  try {
    await dbPool.insert(notificationDigestQueue).values({
      userId,
      payload,
      sendAfter: new Date(Date.now() + DIGEST_WINDOW_MS),
    });
  } catch (error) {
    console.error("[Digest Queue] Failed to enqueue:", error);
  }
};

/** Claim due digest rows, group by recipient, and send one email each. */
const pollDigestQueue = async (): Promise<void> => {
  const client = await pgPool.connect();
  try {
    await client.query("BEGIN");

    const { rows } = await client.query(
      `SELECT id, user_id, payload FROM notification_digest_queue
       WHERE send_after <= now()
       ORDER BY send_after
       FOR UPDATE SKIP LOCKED
       LIMIT $1`,
      [POLL_BATCH_SIZE],
    );

    if (!rows.length) {
      await client.query("COMMIT");
      return;
    }

    const byUser = new Map<string, { ids: string[]; items: DigestPayload[] }>();
    for (const row of rows) {
      const userId = row.user_id as string;
      const group = byUser.get(userId) ?? { ids: [], items: [] };
      group.ids.push(row.id as string);
      group.items.push(row.payload as DigestPayload);
      byUser.set(userId, group);
    }

    for (const { ids, items } of byUser.values()) {
      const to = items[0]?.to;
      if (!to) {
        // malformed payload; drop so it does not wedge the queue
        await client.query(
          "DELETE FROM notification_digest_queue WHERE id = ANY($1)",
          [ids],
        );
        continue;
      }

      const manageUrl = items.find((item) => item.manageUrl)?.manageUrl ?? null;
      const { subject, html } = buildTasksAssignedDigestEmail(items, manageUrl);
      const params: EmailParams = { to, subject, body: html, html: true };
      if (manageUrl) params.headers = { "List-Unsubscribe": `<${manageUrl}>` };

      try {
        await notifications.sendEmail(params);
      } catch (error) {
        // keep this recipient's rows for the next poll; others still send
        console.error("[Digest Queue] Send failed, will retry:", error);
        continue;
      }

      await client.query(
        "DELETE FROM notification_digest_queue WHERE id = ANY($1)",
        [ids],
      );
    }

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("[Digest Queue] Poll error:", error);
  } finally {
    client.release();
  }
};

/** Start the digest poller (idempotent). */
export const startDigestPoller = (): void => {
  if (pollTimer) return;
  pollTimer = setInterval(pollDigestQueue, POLL_INTERVAL_MS).unref();
  pollDigestQueue();
  console.info(
    `[Digest Queue] Poller started (interval: ${POLL_INTERVAL_MS}ms)`,
  );
};

/** Exposed for tests: run one poll cycle synchronously. */
export const _pollDigestQueueOnce = pollDigestQueue;
