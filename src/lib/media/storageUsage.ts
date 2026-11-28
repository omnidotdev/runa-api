/**
 * Per-workspace attachment storage accounting.
 */

import { eq, sql } from "drizzle-orm";

import { dbPool } from "lib/db/db";
import { attachments } from "lib/db/schema";

/**
 * Total attachment bytes stored by an organization.
 *
 * The sum is computed as `bigint`: an `int` cast overflows past ~2 GiB, which
 * would fail every upload for a workspace beyond that point. Postgres returns
 * `bigint` as a string, so it is converted to a number here (exact up to
 * `Number.MAX_SAFE_INTEGER`, about 8 PiB)
 */
export const getOrganizationStorageBytes = async (
  organizationId: string,
): Promise<number> => {
  const [row] = await dbPool
    .select({
      total:
        sql<number>`coalesce(sum(${attachments.fileSize}), 0)::bigint`.mapWith(
          Number,
        ),
    })
    .from(attachments)
    .where(eq(attachments.organizationId, organizationId));

  return row?.total ?? 0;
};
