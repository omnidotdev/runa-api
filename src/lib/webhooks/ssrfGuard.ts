/**
 * SSRF guard for outbound webhooks. A webhook endpoint URL is attacker-chosen,
 * so delivering to it is a server-side request forgery vector: an endpoint of
 * `http://169.254.169.254/...` or `http://10.0.0.5/...` would make Runa's
 * servers fetch internal/cloud-metadata resources. This classifies a host as
 * public or blocked.
 *
 * This is the static half (scheme + literal host/IP classification). Because a
 * hostname can still resolve to a private address (DNS rebinding), the delivery
 * path MUST additionally resolve the host and re-check the resolved IP against
 * {@link blockedWebhookHostReason} right before connecting, and pin to it.
 */

import { isIP } from "node:net";

/** Internal-only hostname shapes: localhost, cluster-internal suffixes, or a
 * bare single-label name (a public host is always multi-label). */
const isInternalHostname = (host: string): boolean =>
  host === "localhost" ||
  host.endsWith(".internal") ||
  host.endsWith(".local") ||
  !host.includes(".");

const ipv4Reason = (host: string): string | null => {
  const octets = host.split(".").map(Number);
  if (
    octets.length !== 4 ||
    octets.some((o) => Number.isNaN(o) || o < 0 || o > 255)
  ) {
    return "invalid IPv4";
  }
  const [a, b] = octets as [number, number, number, number];
  if (a === 0) return "unspecified range";
  if (a === 10) return "private range (10/8)";
  if (a === 127) return "loopback (127/8)";
  if (a === 169 && b === 254) return "link-local / metadata (169.254/16)";
  if (a === 172 && b >= 16 && b <= 31) return "private range (172.16/12)";
  if (a === 192 && b === 168) return "private range (192.168/16)";
  if (a === 100 && b >= 64 && b <= 127) return "carrier-grade NAT (100.64/10)";
  return null;
};

const ipv6Reason = (raw: string): string | null => {
  const host = raw.toLowerCase();
  // IPv4-mapped (::ffff:a.b.c.d) - classify the embedded IPv4
  const mapped = host.match(/::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped?.[1]) return ipv4Reason(mapped[1]) ?? null;
  if (host === "::1") return "loopback (::1)";
  if (host === "::") return "unspecified (::)";
  if (host.startsWith("fc") || host.startsWith("fd"))
    return "unique-local (fc00::/7)";
  if (/^fe[89ab]/.test(host)) return "link-local (fe80::/10)";
  return null;
};

/**
 * Reason a webhook host is blocked, or null if it is an allowed public target.
 * Accepts a hostname or an IP literal (IPv6 may be given with or without
 * brackets).
 */
export const blockedWebhookHostReason = (hostInput: string): string | null => {
  const host = hostInput.replace(/^\[|\]$/g, "").toLowerCase();
  const kind = isIP(host);
  if (kind === 4) return ipv4Reason(host);
  if (kind === 6) return ipv6Reason(host);
  return isInternalHostname(host) ? "internal hostname" : null;
};

/**
 * Throw unless `url` is a well-formed http(s) URL to a public host. Use when a
 * user registers or updates a webhook endpoint.
 */
export const assertAllowedWebhookUrl = (url: string): void => {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("Webhook URL is not a valid URL");
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new Error(`Webhook URL must be http(s), got ${parsed.protocol}`);
  }
  const reason = blockedWebhookHostReason(parsed.hostname);
  if (reason) {
    throw new Error(`Webhook URL host is not allowed: ${reason}`);
  }
};
