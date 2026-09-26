import { describe, expect, it } from "bun:test";

import { parseMetadata } from "../parseMetadata";

const base = "https://example.com/page";

describe("parseMetadata", () => {
  it("prefers og:title over <title> and decodes entities", () => {
    const html = `<head><title>Fallback</title>
      <meta property="og:title" content="Real &amp; True Title" /></head>`;
    expect(parseMetadata(html, base).title).toBe("Real & True Title");
  });

  it("falls back to <title> when no og:title", () => {
    expect(
      parseMetadata("<head><title>Just Title</title></head>", base).title,
    ).toBe("Just Title");
  });

  it("reads og:description and resolves a relative og:image", () => {
    const html = `<meta property="og:description" content="A page">
      <meta property="og:image" content="/img/card.png">`;
    const meta = parseMetadata(html, base);
    expect(meta.description).toBe("A page");
    expect(meta.imageUrl).toBe("https://example.com/img/card.png");
  });

  it("resolves a declared favicon link to absolute", () => {
    const html = `<link rel="icon" href="/assets/fav.png">`;
    expect(parseMetadata(html, base).faviconHref).toBe(
      "https://example.com/assets/fav.png",
    );
  });

  it("falls back to /favicon.ico at the origin when none declared", () => {
    expect(parseMetadata("<title>x</title>", base).faviconHref).toBe(
      "https://example.com/favicon.ico",
    );
  });

  it("returns null title when absent", () => {
    expect(parseMetadata("<p>no head</p>", base).title).toBeNull();
  });
});
