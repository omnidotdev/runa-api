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

/** Build the proxied serving URL for a storage key */
export const proxiedUrl = (storageKey: string): string => {
  const base = (PUBLIC_API_URL ?? "").replace(/\/$/, "");
  return `${base}/api/attachments/file/${encodeURIComponent(storageKey)}`;
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
