import { describe, expect, it } from "bun:test";

import {
  extractMentionIds,
  htmlToText,
  newlyMentionedIds,
} from "lib/notifications/mentions";

const ADA = "0b6a2d1e-3c4f-4a5b-8c7d-9e0f1a2b3c4d";
const BOB = "1c7b3e2f-4d5a-4b6c-9d8e-0f1a2b3c4d5e";

const mention = (id: string, label: string) =>
  `<a href="#mention-${id}" class="link">@${label}</a>`;

describe("extractMentionIds", () => {
  it("returns the IDP ids of mention links, deduplicated and in order", () => {
    const html = `<p>${mention(ADA, "Ada")} and ${mention(BOB, "Bob")}, again ${mention(ADA, "Ada")}</p>`;
    expect(extractMentionIds(html)).toEqual([ADA, BOB]);
  });

  it("ignores legacy id-less mentions and ordinary links", () => {
    const html = `<p><a href="#">@Ada</a> <a href="https://example.com">site</a></p>`;
    expect(extractMentionIds(html)).toEqual([]);
  });

  it("ignores malformed ids", () => {
    expect(extractMentionIds(`<a href="#mention-not-a-uuid">@x</a>`)).toEqual(
      [],
    );
  });

  it("handles empty input", () => {
    expect(extractMentionIds(null)).toEqual([]);
    expect(extractMentionIds("")).toEqual([]);
  });
});

describe("newlyMentionedIds", () => {
  it("returns only people mentioned in the new text but not the old", () => {
    const before = `<p>${mention(ADA, "Ada")}</p>`;
    const after = `<p>${mention(ADA, "Ada")} ${mention(BOB, "Bob")}</p>`;
    expect(newlyMentionedIds(before, after)).toEqual([BOB]);
  });

  it("treats a missing previous value as no mentions", () => {
    expect(newlyMentionedIds(null, mention(ADA, "Ada"))).toEqual([ADA]);
  });

  it("returns nothing when a mention is removed", () => {
    expect(newlyMentionedIds(mention(ADA, "Ada"), "<p>hi</p>")).toEqual([]);
  });
});

describe("htmlToText", () => {
  it("strips markup, decodes entities, and keeps block boundaries apart", () => {
    expect(
      htmlToText(
        "<p>Hello <strong>there</strong></p><p>Tom &amp; Jerry&nbsp;&lt;3</p>",
      ),
    ).toBe("Hello there Tom & Jerry <3");
  });

  it("decodes numeric character references and leaves unknown entities", () => {
    expect(
      htmlToText("<p>It&#39;s &#x27;done&#x27; &#8212; caf&#233; &copy;</p>"),
    ).toBe("It's 'done' \u2014 caf\u00e9 &copy;");
    expect(htmlToText("&amp;lt;b&amp;gt;")).toBe("&lt;b&gt;");
  });

  it("handles empty input", () => {
    expect(htmlToText(undefined)).toBe("");
  });
});
