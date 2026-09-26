import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { createHash, randomUUID } from "node:crypto";

import { Pool } from "pg";

import { getOrCreateUnfurl } from "../unfurl";

/**
 * Integration test for the unfurl cache against a real Postgres (DATABASE_URL).
 * Exercises the cache-HIT path deterministically (a fresh row is pre-seeded, so
 * no network fetch happens) and the invalid-URL guard. The live fetch path is
 * covered by the SSRF/parseMetadata unit tests
 */
const DATABASE_URL = process.env.DATABASE_URL;

const pool = new Pool({ connectionString: DATABASE_URL });

const url = `https://example.com/cache-test-${randomUUID()}`;
const urlHash = createHash("sha256").update(url).digest("hex");

describe.skipIf(!DATABASE_URL)("getOrCreateUnfurl", () => {
  beforeAll(async () => {
    await pool.query(
      `INSERT INTO link_unfurl (url, url_hash, status, title, favicon_data_uri, fetched_at, updated_at)
       VALUES ($1, $2, 'ok', 'Cached Title', 'data:image/png;base64,AAAA', now(), now())`,
      [url, urlHash],
    );
  });

  afterAll(async () => {
    await pool.query(`DELETE FROM link_unfurl WHERE url_hash = $1`, [urlHash]);
    await pool.end();
  });

  it("returns a fresh cached row without refetching", async () => {
    const result = await getOrCreateUnfurl(pool, url);
    expect(result.status).toBe("ok");
    expect(result.title).toBe("Cached Title");
    expect(result.faviconDataUri).toBe("data:image/png;base64,AAAA");
  });

  it("rejects a non-http(s) URL", async () => {
    await expect(getOrCreateUnfurl(pool, "ftp://example.com")).rejects.toThrow(
      "Invalid URL",
    );
  });
});
