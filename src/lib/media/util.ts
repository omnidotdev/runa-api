/**
 * Shared helpers for the attachment routes.
 */

import { AUTH_BASE_URL, PUBLIC_API_URL } from "lib/config/env.config";

/**
 * Resolve the caller's subject (IDP id) and token from a bearer token via the
 * userinfo endpoint. Returns nulls when the token is missing or invalid.
 */
export const resolveSubject = async (
  authorization: string | null,
): Promise<{ sub: string | null; token: string | null }> => {
  const token = authorization?.startsWith("Bearer ")
    ? authorization.slice(7)
    : null;
  if (!token || !AUTH_BASE_URL) return { sub: null, token };

  try {
    const response = await fetch(`${AUTH_BASE_URL}/oauth2/userinfo`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) return { sub: null, token };

    const claims = (await response.json()) as { sub?: string };
    return { sub: claims.sub ?? null, token };
  } catch {
    return { sub: null, token };
  }
};

/** Path segment that precedes the storage key in a proxied serve URL */
const PROXY_PATH_PREFIX = "/api/attachments/file/";

/** Build the proxied serving URL for a storage key */
export const proxiedUrl = (storageKey: string): string => {
  const base = (PUBLIC_API_URL ?? "").replace(/\/$/, "");
  return `${base}${PROXY_PATH_PREFIX}${encodeURIComponent(storageKey)}`;
};

/**
 * Recover the storage key from a proxied serve URL (the inverse of
 * `proxiedUrl`). Returns null for URLs that are not proxied serve URLs (e.g.
 * external avatars) so callers never act on keys they don't own.
 */
export const storageKeyFromUrl = (url: string): string | null => {
  const index = url.indexOf(PROXY_PATH_PREFIX);
  if (index === -1) return null;

  const encoded = url.slice(index + PROXY_PATH_PREFIX.length);
  if (!encoded) return null;

  try {
    return decodeURIComponent(encoded);
  } catch {
    return null;
  }
};

/**
 * Derive the thumbnail storage key from an original key.
 * `runa/{org}/{task}/{hash}.{ext}` -> `runa/{org}/{task}/thumb/{hash}.webp`
 */
export const thumbnailKeyFor = (storageKey: string): string => {
  const parts = storageKey.split("/");
  const filename = parts.pop() ?? "";
  const hash = filename.split(".")[0];
  return [...parts, "thumb", `${hash}.webp`].join("/");
};
