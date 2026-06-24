import { describe, expect, it } from "bun:test";

import {
  allProjectMediaKeys,
  dereferencedProjectMediaKeys,
} from "lib/media/projectMediaKeys";

const url = (key: string) =>
  `https://api.example.com/api/attachments/file/${encodeURIComponent(key)}`;

const AVATAR = "runa/org/avatars/old.jpg";
const BG = "runa/org/backgrounds/old.jpg";

describe("dereferencedProjectMediaKeys", () => {
  it("returns nothing when the patch omits both media fields", () => {
    expect(
      dereferencedProjectMediaKeys(
        { image: url(AVATAR), background: { kind: "image", assetId: BG } },
        { name: "renamed" },
      ),
    ).toEqual([]);
  });

  it("frees the old avatar when image is replaced", () => {
    expect(
      dereferencedProjectMediaKeys(
        { image: url(AVATAR) },
        { image: url("runa/org/avatars/new.jpg") },
      ),
    ).toEqual([AVATAR]);
  });

  it("frees the old avatar when image is removed (set null)", () => {
    expect(
      dereferencedProjectMediaKeys({ image: url(AVATAR) }, { image: null }),
    ).toEqual([AVATAR]);
  });

  it("keeps the avatar when the image is unchanged", () => {
    expect(
      dereferencedProjectMediaKeys(
        { image: url(AVATAR) },
        { image: url(AVATAR) },
      ),
    ).toEqual([]);
  });

  it("ignores external (non-proxied) image URLs", () => {
    expect(
      dereferencedProjectMediaKeys(
        { image: "https://gravatar.com/avatar/abc" },
        { image: null },
      ),
    ).toEqual([]);
  });

  it("frees the old background image when switched to a preset", () => {
    expect(
      dereferencedProjectMediaKeys(
        { background: { kind: "image", assetId: BG } },
        { background: { kind: "gradient", token: "dusk" } },
      ),
    ).toEqual([BG]);
  });

  it("frees the old background image when removed", () => {
    expect(
      dereferencedProjectMediaKeys(
        { background: { kind: "image", assetId: BG } },
        { background: null },
      ),
    ).toEqual([BG]);
  });

  it("keeps the background when the image asset is unchanged", () => {
    expect(
      dereferencedProjectMediaKeys(
        { background: { kind: "image", assetId: BG } },
        { background: { kind: "image", assetId: BG, position: "top" } },
      ),
    ).toEqual([]);
  });

  it("does nothing when the prior background was a preset (no asset)", () => {
    expect(
      dereferencedProjectMediaKeys(
        { background: { kind: "solid", token: "amber" } },
        { background: null },
      ),
    ).toEqual([]);
  });

  it("frees both when image and background are cleared together", () => {
    expect(
      dereferencedProjectMediaKeys(
        { image: url(AVATAR), background: { kind: "image", assetId: BG } },
        { image: null, background: null },
      ),
    ).toEqual([AVATAR, BG]);
  });
});

describe("allProjectMediaKeys", () => {
  it("returns nothing for a project with no media", () => {
    expect(allProjectMediaKeys({})).toEqual([]);
    expect(allProjectMediaKeys(null)).toEqual([]);
  });

  it("returns the image key and image background asset", () => {
    expect(
      allProjectMediaKeys({
        image: url(AVATAR),
        background: { kind: "image", assetId: BG },
      }),
    ).toEqual([AVATAR, BG]);
  });

  it("ignores preset backgrounds and external images", () => {
    expect(
      allProjectMediaKeys({
        image: "https://gravatar.com/avatar/abc",
        background: { kind: "gradient", token: "dusk" },
      }),
    ).toEqual([]);
  });
});
