interface LinkMetadata {
  title: string | null;
  description: string | null;
  imageUrl: string | null;
  faviconHref: string | null;
}

/** Decode the small set of HTML entities that appear in meta/title text. */
const decodeEntities = (value: string): string =>
  value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0*39;/g, "'")
    .replace(/&#x0*27;/gi, "'")
    .replace(/&nbsp;/g, " ")
    .trim();

/** First capture group of the first matching pattern, decoded, or null. */
const firstMatch = (html: string, patterns: RegExp[]): string | null => {
  for (const pattern of patterns) {
    const match = pattern.exec(html);
    if (match?.[1]) return decodeEntities(match[1]);
  }
  return null;
};

const resolve = (href: string | null, base: string): string | null => {
  if (!href) return null;
  try {
    return new URL(href, base).toString();
  } catch {
    return null;
  }
};

// Match a <meta> property/name in either attribute order
const metaContent = (key: string) => [
  new RegExp(
    `<meta[^>]+(?:property|name)=["']${key}["'][^>]+content=["']([^"']*)["']`,
    "i",
  ),
  new RegExp(
    `<meta[^>]+content=["']([^"']*)["'][^>]+(?:property|name)=["']${key}["']`,
    "i",
  ),
];

/**
 * Extract link preview metadata from an HTML string, resolving relative URLs
 * against the page's own URL. Pure and DOM-free (regex over the markup), so it
 * is safe to run without a parser and easy to test. Prefers OpenGraph values,
 * falling back to <title> and the origin's /favicon.ico
 */
export const parseMetadata = (html: string, baseUrl: string): LinkMetadata => {
  const title =
    firstMatch(html, metaContent("og:title")) ??
    firstMatch(html, [/<title[^>]*>([\s\S]*?)<\/title>/i]);

  const description =
    firstMatch(html, metaContent("og:description")) ??
    firstMatch(html, metaContent("description"));

  const imageUrl = resolve(firstMatch(html, metaContent("og:image")), baseUrl);

  const declaredFavicon = firstMatch(html, [
    /<link[^>]+rel=["'](?:shortcut icon|icon|apple-touch-icon)["'][^>]+href=["']([^"']+)["']/i,
    /<link[^>]+href=["']([^"']+)["'][^>]+rel=["'](?:shortcut icon|icon|apple-touch-icon)["']/i,
  ]);

  const faviconHref =
    resolve(declaredFavicon, baseUrl) ?? resolve("/favicon.ico", baseUrl);

  return { title, description, imageUrl, faviconHref };
};
