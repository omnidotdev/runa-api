import { describe, expect, it } from "bun:test";

import { htmlToText, plainTextToHtml } from "lib/mcp/content";

describe("plainTextToHtml", () => {
  it("wraps each line in a paragraph", () => {
    expect(plainTextToHtml("one\ntwo")).toBe("<p>one</p><p>two</p>");
  });

  it("escapes markup so client text can never inject HTML", () => {
    const html = plainTextToHtml(
      '<img src=x onerror="alert(1)"> & <b>bold</b>',
    );
    expect(html).not.toContain("<img");
    expect(html).not.toContain("<b>");
    expect(html).toContain("&lt;img");
    expect(html).toContain("&amp;");
  });

  it("round-trips through htmlToText as the original text", () => {
    const text = "Ship <MCP> & docs";
    expect(htmlToText(plainTextToHtml(text))).toBe(text);
  });
});
