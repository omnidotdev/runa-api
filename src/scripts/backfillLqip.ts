/**
 * One-off backfill: fill the blur-up preview (LQIP) of project images uploaded
 * before previews were stored at upload time.
 *
 * Covers the project avatar (`project.image_lqip`) and an uploaded board
 * background (`project.background ->> 'lqip'`). Reads each image from object
 * storage the same way the serve route does, makes the preview with the same
 * helper the upload routes use (so it always fits the check constraints), and
 * writes only that preview, only where it is still NULL and the image is
 * unchanged. Safe to re-run: filled rows are never selected or overwritten.
 * Unreadable objects, non-image content, and per-row errors are skipped or
 * counted as failed without stopping the run. Logs only counts and row ids.
 *
 * Usage (in the API container):
 *   bun run backfill:lqip [--dry-run]
 *
 * `--dry-run` reads and previews every candidate but writes nothing. Exits 1
 * when any row failed, so a rerun can pick those up
 */

import { GetObjectCommand } from "@aws-sdk/client-s3";
import { and, asc, eq, gt, isNotNull, isNull, sql } from "drizzle-orm";

import { S3_BUCKET } from "lib/config/env.config";
import { dbPool, pgPool } from "lib/db/db";
import { projects } from "lib/db/schema";
import { makeProjectLqip } from "lib/media/lqip";
import { s3 } from "lib/media/s3Client";
import { storageKeyFromUrl } from "lib/media/util";

import type { GetObjectCommandOutput } from "@aws-sdk/client-s3";

/** Rows read per batch */
const BATCH_SIZE = 50;

/** Give up on reading one image after this long */
const READ_TIMEOUT_MS = 30_000;

/** A source of rows still missing a preview */
export interface BackfillTarget<Row extends { id: string }> {
  /** Shown in the log, e.g. `project.image_lqip` */
  name: string;
  /** Next rows missing a preview, ordered by id, after `afterId` */
  fetchBatch: (afterId: string | null, limit: number) => Promise<Row[]>;
  /** The image bytes, or null when the object is missing or not an image */
  readImage: (row: Row, signal: AbortSignal) => Promise<Buffer | null>;
  /** Store the preview where it is still NULL, true when a row changed */
  write: (row: Row, lqip: string) => Promise<boolean>;
}

export interface BackfillOptions {
  dryRun: boolean;
  makeLqip: (bytes: Buffer) => Promise<string | null>;
  batchSize?: number;
  timeoutMs?: number;
  log?: (line: string) => void;
}

export interface BackfillSummary {
  scanned: number;
  filled: number;
  skipped: number;
  failed: number;
}

/** Run `read` with an abort signal, rejecting once `ms` elapses */
const withTimeout = async <T>(
  read: (signal: AbortSignal) => Promise<T>,
  ms: number,
): Promise<T> => {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      const error = new Error(`read timed out after ${ms}ms`);
      error.name = "TimeoutError";
      reject(error);
    }, ms);
  });

  try {
    return await Promise.race([read(controller.signal), timeout]);
  } finally {
    clearTimeout(timer);
  }
};

/** Error class name only, since messages can carry object keys or URLs */
const errorName = (error: unknown) =>
  error instanceof Error ? error.name : "UnknownError";

/**
 * Walk every candidate row of one target in id order, filling its preview.
 * Paging by id (not offset) means a row that is skipped or fails is never
 * fetched again in the same run, and a dry run terminates
 */
export const backfillTarget = async <Row extends { id: string }>(
  target: BackfillTarget<Row>,
  {
    dryRun,
    makeLqip,
    batchSize = BATCH_SIZE,
    timeoutMs = READ_TIMEOUT_MS,
    log = console.info,
  }: BackfillOptions,
): Promise<BackfillSummary> => {
  const summary: BackfillSummary = {
    scanned: 0,
    filled: 0,
    skipped: 0,
    failed: 0,
  };
  let afterId: string | null = null;

  for (;;) {
    const rows = await target.fetchBatch(afterId, batchSize);
    if (!rows.length) break;

    for (const row of rows) {
      summary.scanned++;

      try {
        const bytes = await withTimeout(
          (signal) => target.readImage(row, signal),
          timeoutMs,
        );
        if (!bytes) {
          summary.skipped++;
          log(`[${target.name}] skip ${row.id}: unreadable or not an image`);
          continue;
        }

        const lqip = await makeLqip(bytes);
        if (!lqip) {
          summary.skipped++;
          log(`[${target.name}] skip ${row.id}: no preview could be made`);
          continue;
        }

        if (dryRun) {
          summary.filled++;
          continue;
        }

        if (await target.write(row, lqip)) {
          summary.filled++;
        } else {
          summary.skipped++;
          log(`[${target.name}] skip ${row.id}: changed during the run`);
        }
      } catch (error) {
        summary.failed++;
        log(`[${target.name}] fail ${row.id}: ${errorName(error)}`);
      }
    }

    afterId = rows[rows.length - 1]?.id ?? null;
    log(
      `[${target.name}] progress: scanned ${summary.scanned}, ${dryRun ? "would fill" : "filled"} ${summary.filled}`,
    );
  }

  return summary;
};

/** Read an object's bytes, or null when missing, empty, or not an image */
const readObject = async (
  key: string,
  signal: AbortSignal,
): Promise<Buffer | null> => {
  if (!s3 || !S3_BUCKET) throw new Error("object storage is not configured");

  let response: GetObjectCommandOutput;
  try {
    response = await s3.send(
      new GetObjectCommand({ Bucket: S3_BUCKET, Key: key }),
      {
        abortSignal: signal,
      },
    );
  } catch (error) {
    if (errorName(error) === "NoSuchKey") return null;
    throw error;
  }

  if (!response.Body) return null;
  if (!response.ContentType?.startsWith("image/")) return null;

  const bytes = await response.Body.transformToByteArray();
  return bytes.length ? Buffer.from(bytes) : null;
};

interface AvatarRow {
  id: string;
  image: string;
}

interface BackgroundRow {
  id: string;
  assetId: string;
}

/** Store an avatar preview, only while still NULL and the avatar is unchanged */
export const avatarLqipUpdate = (row: AvatarRow, lqip: string) =>
  dbPool
    .update(projects)
    .set({ imageLqip: lqip })
    .where(
      and(
        eq(projects.id, row.id),
        eq(projects.image, row.image),
        isNull(projects.imageLqip),
      ),
    )
    .returning({ id: projects.id });

/** Store a background preview, only while still NULL and the image is unchanged */
export const backgroundLqipUpdate = (row: BackgroundRow, lqip: string) =>
  dbPool
    .update(projects)
    .set({
      background: sql`jsonb_set(${projects.background}, '{lqip}', to_jsonb(${lqip}::text))`,
    })
    .where(
      and(
        eq(projects.id, row.id),
        sql`${projects.background} ->> 'kind' = 'image'`,
        sql`${projects.background} ->> 'assetId' = ${row.assetId}`,
        sql`${projects.background} ->> 'lqip' is null`,
      ),
    )
    .returning({ id: projects.id });

const avatarTarget: BackfillTarget<AvatarRow> = {
  name: "project.image_lqip",
  fetchBatch: async (afterId, limit) => {
    const rows = await dbPool
      .select({ id: projects.id, image: projects.image })
      .from(projects)
      .where(
        and(
          isNotNull(projects.image),
          isNull(projects.imageLqip),
          afterId ? gt(projects.id, afterId) : undefined,
        ),
      )
      .orderBy(asc(projects.id))
      .limit(limit);

    return rows.flatMap((row) =>
      row.image ? [{ ...row, image: row.image }] : [],
    );
  },
  readImage: (row, signal) => {
    // Only avatars this API stored and serves; any other URL is not ours to fetch
    const key = storageKeyFromUrl(row.image);
    return key ? readObject(key, signal) : Promise.resolve(null);
  },
  write: async (row, lqip) => (await avatarLqipUpdate(row, lqip)).length > 0,
};

const backgroundTarget: BackfillTarget<BackgroundRow> = {
  name: "project.background.lqip",
  fetchBatch: async (afterId, limit) => {
    const rows = await dbPool
      .select({
        id: projects.id,
        assetId: sql<string | null>`${projects.background} ->> 'assetId'`,
      })
      .from(projects)
      .where(
        and(
          sql`${projects.background} ->> 'kind' = 'image'`,
          sql`${projects.background} ->> 'assetId' is not null`,
          sql`${projects.background} ->> 'lqip' is null`,
          afterId ? gt(projects.id, afterId) : undefined,
        ),
      )
      .orderBy(asc(projects.id))
      .limit(limit);

    return rows.flatMap((row) =>
      row.assetId ? [{ id: row.id, assetId: row.assetId }] : [],
    );
  },
  readImage: (row, signal) => readObject(row.assetId, signal),
  write: async (row, lqip) =>
    (await backgroundLqipUpdate(row, lqip)).length > 0,
};

const USAGE = "Usage: bun run backfill:lqip [--dry-run]";

const main = async () => {
  const args = process.argv.slice(2);
  const unknown = args.find((arg) => arg !== "--dry-run");
  if (unknown) throw new Error(`Unknown argument ${unknown}\n${USAGE}`);
  const dryRun = args.includes("--dry-run");
  if (!s3 || !S3_BUCKET) throw new Error("object storage is not configured");

  console.info(`${dryRun ? "DRY RUN" : "APPLY"}: backfilling image previews`);

  const total: BackfillSummary = {
    scanned: 0,
    filled: 0,
    skipped: 0,
    failed: 0,
  };
  const report = (name: string, summary: BackfillSummary) => {
    console.info(
      `[${name}] scanned ${summary.scanned}, ${dryRun ? "would fill" : "filled"} ${summary.filled}, skipped ${summary.skipped}, failed ${summary.failed}`,
    );
    total.scanned += summary.scanned;
    total.filled += summary.filled;
    total.skipped += summary.skipped;
    total.failed += summary.failed;
  };
  const options = { dryRun, makeLqip: makeProjectLqip };

  report(avatarTarget.name, await backfillTarget(avatarTarget, options));
  report(
    backgroundTarget.name,
    await backfillTarget(backgroundTarget, options),
  );

  console.info(
    `Summary${dryRun ? " (dry run, nothing written)" : ""}: scanned ${total.scanned}, ${dryRun ? "would fill" : "filled"} ${total.filled}, skipped ${total.skipped}, failed ${total.failed}`,
  );

  return total;
};

if (import.meta.main) {
  main()
    .then(async (total) => {
      await pgPool.end();
      process.exit(total.failed ? 1 : 0);
    })
    .catch(async (error) => {
      console.error(error instanceof Error ? error.message : error);
      await pgPool.end().catch(() => undefined);
      process.exit(1);
    });
}
