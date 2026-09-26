import { createHash } from "node:crypto";
import { lookup } from "node:dns/promises";

import { parseMetadata } from "./parseMetadata";
import { isPrivateIp, parseHttpUrl } from "./ssrf";

const TIMEOUT_MS = 5000;
const MAX_HTML_BYTES = 1_000_000;
const MAX_FAVICON_BYTES = 50_000;
const MAX_REDIRECTS = 3;
// Re-fetch a cached unfurl after this long
const TTL_MS = 7 * 24 * 60 * 60 * 1000;

const USER_AGENT = "RunaLinkPreview/1.0 (+https://runa.omni.dev)";

/** Minimal pg pool surface (node-postgres Pool satisfies this). */
interface PoolLike {
  query: (
    text: string,
    values?: unknown[],
  ) => Promise<{ rows: Array<Record<string, unknown>> }>;
}

interface UnfurlResult {
  url: string;
  status: "ok" | "error";
  title: string | null;
  description: string | null;
  imageUrl: string | null;
  faviconDataUri: string | null;
}

/** Reject a URL whose host resolves to any non-public address. */
const assertPublicHost = async (url: URL): Promise<void> => {
  const addresses = await lookup(url.hostname, { all: true });
  if (!addresses.length) throw new Error("DNS resolution failed");
  for (const { address } of addresses) {
    if (isPrivateIp(address)) throw new Error("Blocked (non-public address)");
  }
};

/** Read a response body up to `maxBytes`, aborting the stream past the cap. */
const readCapped = async (
  response: Response,
  maxBytes: number,
): Promise<Uint8Array> => {
  const reader = response.body?.getReader();
  if (!reader) return new Uint8Array();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel();
      break;
    }
    chunks.push(value);
  }
  const out = new Uint8Array(Math.min(total, maxBytes));
  let offset = 0;
  for (const chunk of chunks) {
    if (offset + chunk.byteLength > out.length) break;
    out.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return out;
};

/** SSRF-guarded fetch that re-validates the host on every redirect hop. */
const safeFetch = async (
  rawUrl: string,
  accept: string,
  maxBytes: number,
): Promise<{ url: URL; body: Uint8Array; contentType: string }> => {
  let current = parseHttpUrl(rawUrl);
  if (!current) throw new Error("Invalid URL");

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    await assertPublicHost(current);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    let response: Response;
    try {
      response = await fetch(current, {
        redirect: "manual",
        signal: controller.signal,
        headers: { accept, "user-agent": USER_AGENT },
      });
    } finally {
      clearTimeout(timer);
    }

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) throw new Error("Redirect without location");
      const next = parseHttpUrl(new URL(location, current).toString());
      if (!next) throw new Error("Invalid redirect target");
      current = next;
      continue;
    }

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    return {
      url: current,
      body: await readCapped(response, maxBytes),
      contentType: response.headers.get("content-type") ?? "",
    };
  }

  throw new Error("Too many redirects");
};

/** Fetch a favicon and encode it as a size-capped data URI, or null on failure. */
const fetchFaviconDataUri = async (href: string): Promise<string | null> => {
  try {
    const { body, contentType } = await safeFetch(
      href,
      "image/*",
      MAX_FAVICON_BYTES,
    );
    if (!contentType.startsWith("image/") || !body.byteLength) return null;
    const base64 = Buffer.from(body).toString("base64");
    return `data:${contentType.split(";")[0]};base64,${base64}`;
  } catch {
    return null;
  }
};

/** Fetch and parse a URL into preview metadata (throws on SSRF/network error). */
const fetchUnfurl = async (rawUrl: string): Promise<UnfurlResult> => {
  const { url, body, contentType } = await safeFetch(
    rawUrl,
    "text/html,application/xhtml+xml",
    MAX_HTML_BYTES,
  );

  if (!contentType.includes("text/html")) {
    return {
      url: rawUrl,
      status: "ok",
      title: null,
      description: null,
      imageUrl: null,
      faviconDataUri: null,
    };
  }

  const html = new TextDecoder().decode(body);
  const meta = parseMetadata(html, url.toString());
  const faviconDataUri = meta.faviconHref
    ? await fetchFaviconDataUri(meta.faviconHref)
    : null;

  return {
    url: rawUrl,
    status: "ok",
    title: meta.title,
    description: meta.description,
    imageUrl: meta.imageUrl,
    faviconDataUri,
  };
};

const hashUrl = (url: string) => createHash("sha256").update(url).digest("hex");

const rowToResult = (row: Record<string, unknown>): UnfurlResult => ({
  url: row.url as string,
  status: (row.status as "ok" | "error") ?? "error",
  title: (row.title as string | null) ?? null,
  description: (row.description as string | null) ?? null,
  imageUrl: (row.image_url as string | null) ?? null,
  faviconDataUri: (row.favicon_data_uri as string | null) ?? null,
});

/**
 * Return cached preview metadata for a URL, fetching and caching it on a miss or
 * when the cached row is older than the TTL. Only http(s) URLs are accepted; a
 * failed fetch is cached as a negative ("error") result so we don't hammer a
 * broken URL on every render
 */
export const getOrCreateUnfurl = async (
  pool: PoolLike,
  rawUrl: string,
): Promise<UnfurlResult> => {
  const parsed = parseHttpUrl(rawUrl);
  if (!parsed) throw new Error("Invalid URL");
  const url = parsed.toString();
  const urlHash = hashUrl(url);

  const cached = await pool.query(
    `SELECT url, status, title, description, image_url, favicon_data_uri, fetched_at
     FROM link_unfurl WHERE url_hash = $1`,
    [urlHash],
  );
  const existing = cached.rows[0];
  if (existing) {
    const fetchedAt = new Date(existing.fetched_at as string).getTime();
    if (Date.now() - fetchedAt < TTL_MS) return rowToResult(existing);
  }

  let result: UnfurlResult;
  try {
    result = await fetchUnfurl(url);
  } catch {
    result = {
      url,
      status: "error",
      title: null,
      description: null,
      imageUrl: null,
      faviconDataUri: null,
    };
  }

  await pool.query(
    `INSERT INTO link_unfurl
       (url, url_hash, status, title, description, image_url, favicon_data_uri, fetched_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, now(), now())
     ON CONFLICT (url_hash) DO UPDATE SET
       status = EXCLUDED.status,
       title = EXCLUDED.title,
       description = EXCLUDED.description,
       image_url = EXCLUDED.image_url,
       favicon_data_uri = EXCLUDED.favicon_data_uri,
       fetched_at = now(),
       updated_at = now()`,
    [
      url,
      urlHash,
      result.status,
      result.title,
      result.description,
      result.imageUrl,
      result.faviconDataUri,
    ],
  );

  return result;
};
