import { describe, expect, it } from "bun:test";

import sharp from "sharp";

import { makeProjectLqip } from "lib/media/lqip";

/** Encode a random-noise jpeg of the given size, so the placeholder has detail */
const noiseJpeg = (width: number, height: number) => {
  const pixels = Buffer.alloc(width * height * 3);
  for (let i = 0; i < pixels.length; i++) {
    pixels[i] = Math.floor(Math.random() * 256);
  }

  return sharp(pixels, { raw: { width, height, channels: 3 } })
    .jpeg()
    .toBuffer();
};

// Mirrors the project lqip check constraints
const LQIP_FORMAT = /^data:image\/(webp|png|jpeg);base64,[A-Za-z0-9+/=]+$/;

describe("makeProjectLqip", () => {
  it("makes a placeholder the project check constraints accept", async () => {
    const lqip = await makeProjectLqip(await noiseJpeg(640, 360));

    expect(lqip).toMatch(LQIP_FORMAT);
    expect(lqip?.length).toBeLessThanOrEqual(4096);
  });

  it("drops a placeholder too long for the check constraints", async () => {
    // A 16px-wide placeholder of this strip is far taller than it is wide
    expect(await makeProjectLqip(await noiseJpeg(50, 20000))).toBeNull();
  });

  it("returns null for bytes that are not an image", async () => {
    expect(await makeProjectLqip(Buffer.from("not an image"))).toBeNull();
  });
});
