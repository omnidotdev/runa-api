import { describe, expect, it } from "bun:test";

import { proxiedUrl, storageKeyFromUrl } from "lib/media/util";

describe("storageKeyFromUrl / proxiedUrl", () => {
  // The whole cleanup chain depends on storageKeyFromUrl being the exact
  // inverse of the proxiedUrl that gets stored in project.image.
  it("round-trips every key through proxiedUrl", () => {
    for (const key of [
      "runa/org-1/avatars/abc.jpg",
      "runa/org 2/avatars/a b.png",
      "runa/org-3/backgrounds/d4e5f6.webp",
      "runa/org-4/avatars/name+with&chars.jpeg",
    ]) {
      expect(storageKeyFromUrl(proxiedUrl(key))).toBe(key);
    }
  });

  it("returns null for URLs that are not proxied serve URLs", () => {
    expect(storageKeyFromUrl("https://gravatar.com/avatar/x")).toBeNull();
    expect(
      storageKeyFromUrl("https://api.runa.dev/api/attachments/file/"),
    ).toBeNull();
  });
});
