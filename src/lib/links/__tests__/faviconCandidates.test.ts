import { describe, expect, it } from "bun:test";

import { faviconCandidates } from "../unfurl";

describe("faviconCandidates", () => {
  it("adds the toggled www host so an apex-only link still resolves (LinkedIn)", () => {
    // linkedin.com/favicon.ico is an HTML wall; www.linkedin.com/favicon.ico is
    // the real icon, so the apex-stored link must also try the www host
    expect(faviconCandidates("https://linkedin.com", null, false)).toEqual([
      "https://linkedin.com/favicon.ico",
      "https://www.linkedin.com/favicon.ico",
    ]);
  });

  it("toggles www back to the apex host", () => {
    expect(faviconCandidates("https://www.example.com", null, false)).toEqual([
      "https://www.example.com/favicon.ico",
      "https://example.com/favicon.ico",
    ]);
  });

  it("prefers a same-host declared favicon first", () => {
    expect(
      faviconCandidates(
        "https://topcrush.app",
        "https://topcrush.app/favicon.svg",
        true,
      ),
    ).toEqual([
      "https://topcrush.app/favicon.svg",
      "https://topcrush.app/favicon.ico",
      "https://www.topcrush.app/favicon.ico",
    ]);
  });

  it("ignores a declared favicon from a different host (not same-host)", () => {
    expect(
      faviconCandidates(
        "https://topcrush.app",
        "https://cdn.other/x.ico",
        false,
      ),
    ).toEqual([
      "https://topcrush.app/favicon.ico",
      "https://www.topcrush.app/favicon.ico",
    ]);
  });

  it("returns an empty list when there is no origin", () => {
    expect(faviconCandidates(null, null, false)).toEqual([]);
  });
});
