import { describe, expect, it } from "bun:test";

import {
  MAX_PROJECT_IMAGE_BYTES,
  MAX_UPLOAD_BYTES,
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

    // Regression: fixed per-kind ceilings (image 20MB, video 50MB, file 25MB)
    // used to reject files the paid per-file plan caps (100MB, 250MB) allow
    it("does not undercut the largest paid per-file plan cap", () => {
      const teamCap = 262_144_000;
      expect(MAX_UPLOAD_BYTES).toBeGreaterThanOrEqual(teamCap);
      expect(validateUpload("image/png", 100 * MB)).toEqual({ kind: "image" });
      expect(validateUpload("video/mp4", teamCap)).toEqual({ kind: "video" });
      expect(validateUpload("application/pdf", 100 * MB)).toEqual({
        kind: "file",
      });
    });

    it("rejects a file over the absolute ceiling", () => {
      const result = validateUpload("video/mp4", MAX_UPLOAD_BYTES + 1);
      expect("error" in result).toBe(true);
    });

    it("applies a caller-supplied ceiling (project images)", () => {
      expect(
        "error" in
          validateUpload(
            "image/png",
            MAX_PROJECT_IMAGE_BYTES + 1,
            MAX_PROJECT_IMAGE_BYTES,
          ),
      ).toBe(true);
      expect(
        validateUpload(
          "image/png",
          MAX_PROJECT_IMAGE_BYTES,
          MAX_PROJECT_IMAGE_BYTES,
        ),
      ).toEqual({ kind: "image" });
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

  // The project-avatar route accepts only images: it validates the upload then
  // requires the resolved kind to be "image". These assert that gate's inputs.
  describe("avatar image gate", () => {
    const isImage = (mimeType: string, size: number): boolean => {
      const result = validateUpload(mimeType, size);
      return "kind" in result && result.kind === "image";
    };

    it("accepts an image", () => {
      expect(isImage("image/png", 5 * MB)).toBe(true);
    });

    it("rejects a non-image file (e.g. PDF)", () => {
      expect(isImage("application/pdf", 1 * MB)).toBe(false);
    });

    it("rejects a video", () => {
      expect(isImage("video/mp4", 1 * MB)).toBe(false);
    });
  });
});
