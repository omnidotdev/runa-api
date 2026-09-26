/**
 * SSRF guards for link unfurling. Only http(s) URLs are allowed, and any URL
 * that resolves to a non-public IP (loopback, private, link-local, ULA, CGNAT,
 * unspecified) is rejected. The resolved address must be re-checked on every
 * redirect hop by the caller, since a public host can 30x to an internal one
 */

/** Parse an http(s) URL, returning the URL object or null for anything else. */
export const parseHttpUrl = (value: string): URL | null => {
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    if (!url.hostname) return null;
    return url;
  } catch {
    return null;
  }
};

const ipv4ToParts = (ip: string): number[] | null => {
  const parts = ip.split(".");
  if (parts.length !== 4) return null;
  const nums = parts.map((p) => Number(p));
  if (nums.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return null;
  return nums;
};

const isPrivateIpv4 = (ip: string): boolean => {
  const parts = ipv4ToParts(ip);
  if (!parts) return false;
  const [a, b] = parts;

  if (a === 10) return true; // 10.0.0.0/8
  if (a === 127) return true; // loopback
  if (a === 0) return true; // "this" network / unspecified
  if (a === 169 && b === 254) return true; // link-local
  if (a === 192 && b === 168) return true; // private
  if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
  if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT 100.64.0.0/10
  if (a >= 224) return true; // multicast / reserved / broadcast
  return false;
};

/**
 * Whether an IP (v4 or v6) is non-public and must not be fetched. IPv4-mapped
 * IPv6 addresses are unwrapped and checked as v4.
 */
export const isPrivateIp = (ip: string): boolean => {
  const address = ip.trim().toLowerCase();

  if (ipv4ToParts(address)) return isPrivateIpv4(address);

  // IPv4-mapped IPv6 (::ffff:a.b.c.d) - check the embedded v4
  const mapped = address.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isPrivateIpv4(mapped[1]);

  if (address === "::" || address === "::1") return true; // unspecified / loopback
  if (address.startsWith("fe8") || address.startsWith("fe9")) return true; // fe80::/10
  if (address.startsWith("fea") || address.startsWith("feb")) return true;
  if (address.startsWith("fc") || address.startsWith("fd")) return true; // fc00::/7 ULA

  return false;
};
