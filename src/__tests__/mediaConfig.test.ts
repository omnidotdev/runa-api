import { describe, expect, it } from "bun:test";

import {
  extensionForMimeType,
  kindFromMimeType,
  validateUpload,
} from "lib/media/mediaConfig";

const MB = 1024 * 1024;

describe("mediaConfig", () => {
  describe("kindFromMimeType", () => {
    it("classifies raster images as image", () => {
      expect(kindFromMimeType("image/png")).toBe("image");
      expect(kindFromMimeType("image/avif")).toBe("image");
    });

    it("classifies known video types as video", () => {
      expect(kindFromMimeType("video/mp4")).toBe("video");
    });

    it("classifies everything else as file", () => {
      expect(kindFromMimeType("application/pdf")).toBe("file");
      expect(kindFromMimeType("image/svg+xml")).toBe("file");
    });
  });

  describe("extensionForMimeType", () => {
    it("maps known types", () => {
      expect(extensionForMimeType("image/jpeg")).toBe("jpg");
      expect(extensionForMimeType("application/pdf")).toBe("pdf");
    });

    it("falls back to the sanitized subtype", () => {
      expect(extensionForMimeType("text/x-log")).toBe("xlog");
    });

    it("falls back to bin for long/unusable subtypes", () => {
      expect(
        extensionForMimeType(
          "application/vnd.openxmlformats-officedocument.unknown",
        ),
      ).toBe("bin");
    });
  });

  describe("validateUpload", () => {
    it("accepts an image within the limit", () => {
      expect(validateUpload("image/png", 5 * MB)).toEqual({ kind: "image" });
    });

    it("accepts a generic file within the limit", () => {
      expect(validateUpload("application/pdf", 1 * MB)).toEqual({
        kind: "file",
      });
    });

    it("rejects an oversized image", () => {
      const result = validateUpload("image/png", 21 * MB);
      expect("error" in result).toBe(true);
    });

    it("rejects empty files", () => {
      expect("error" in validateUpload("image/png", 0)).toBe(true);
    });

    it("rejects blocked executable types", () => {
      expect("error" in validateUpload("application/x-msdownload", 1024)).toBe(
        true,
      );
    });
  });
});
