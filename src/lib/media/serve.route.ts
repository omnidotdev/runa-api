/**
 * Attachment serving route.
 *
 * Streams objects through the API rather than redirecting to the bucket, so
 * serving works regardless of whether the S3 endpoint is reachable from the
 * browser (it is cluster-internal in prod and compose-internal when
 * self-hosting). For images it also supports on-the-fly transforms via
 * `?w=&q=&fm=`, computed with sharp. The stored attachment URL points here.
 */

import { Elysia } from "elysia";
import sharp from "sharp";

import { getObject, getObjectBytes, s3 } from "./s3Client";

/** Widths a transform request snaps to, to bound the derivative cache */
const ALLOWED_WIDTHS = [320, 640, 960, 1280, 1600, 1920] as const;

/** Output formats a transform request may ask for */
const ALLOWED_FORMATS = new Set(["webp", "jpeg", "png"]);

/** Content types eligible for on-the-fly transformation */
const TRANSFORMABLE = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

type Transform = { width?: number; quality: number; format?: string };

/** Snap a requested width up to the nearest allowed width */
const snapWidth = (raw: number): number =>
  ALLOWED_WIDTHS.find((w) => w >= raw) ??
  ALLOWED_WIDTHS[ALLOWED_WIDTHS.length - 1];

/** Parse transform params, or null when none/invalid are requested */
const parseTransform = (
  query: Record<string, string | undefined>,
): Transform | null => {
  const w = query.w ? Number.parseInt(query.w, 10) : undefined;
  const q = query.q ? Number.parseInt(query.q, 10) : undefined;
  const fm = query.fm;

  const hasWidth = w !== undefined && Number.isFinite(w) && w > 0;
  const hasFormat = fm !== undefined && ALLOWED_FORMATS.has(fm);
  if (!hasWidth && !hasFormat) return null;

  return {
    width: hasWidth ? snapWidth(w) : undefined,
    quality: q !== undefined && q >= 1 && q <= 100 ? q : 80,
    format: hasFormat ? fm : undefined,
  };
};

/** Apply a sharp transform, returning the bytes and resulting content type */
const applyTransform = async (
  input: Buffer,
  transform: Transform,
): Promise<{ bytes: Buffer; contentType: string }> => {
  let pipeline = sharp(input);
  if (transform.width) {
    pipeline = pipeline.resize(transform.width, null, {
      withoutEnlargement: true,
    });
  }

  const format = transform.format ?? "webp";
  if (format === "jpeg")
    pipeline = pipeline.jpeg({ quality: transform.quality });
  else if (format === "png") pipeline = pipeline.png();
  else pipeline = pipeline.webp({ quality: transform.quality });

  return {
    bytes: await pipeline.toBuffer(),
    contentType: `image/${format}`,
  };
};

const attachmentServeRoutes = new Elysia({ prefix: "/api/attachments" }).get(
  "/file/*",
  async ({ params, query, set }) => {
    if (!s3) {
      set.status = 404;
      return { error: "Attachment serving not configured" };
    }

    const key = decodeURIComponent(
      (params as Record<string, string>)["*"] ?? "",
    );
    if (!key) {
      set.status = 400;
      return { error: "Missing key" };
    }

    // Guess content type from the key extension for transform eligibility
    const ext = key.split(".").pop()?.toLowerCase();
    const guessedType =
      ext === "png"
        ? "image/png"
        : ext === "webp"
          ? "image/webp"
          : ext === "avif"
            ? "image/avif"
            : ext === "jpg" || ext === "jpeg"
              ? "image/jpeg"
              : undefined;

    const transform =
      guessedType && TRANSFORMABLE.has(guessedType)
        ? parseTransform(query as Record<string, string | undefined>)
        : null;

    // No transform: stream the original through the API
    if (!transform) {
      const object = await getObject(key);
      if (!object?.Body) {
        set.status = 404;
        return { error: "Not found" };
      }
      const contentType = object.ContentType ?? "application/octet-stream";
      return new Response(object.Body.transformToWebStream(), {
        headers: {
          "content-type": contentType,
          "cache-control": "private, max-age=31536000, immutable",
        },
      });
    }

    // Transform: read the original and stream a derivative
    const original = await getObjectBytes(key);
    if (!original) {
      set.status = 404;
      return { error: "Not found" };
    }

    try {
      const { bytes, contentType } = await applyTransform(original, transform);
      set.headers["content-type"] = contentType;
      set.headers["cache-control"] = "public, max-age=31536000, immutable";
      return new Response(new Uint8Array(bytes), {
        headers: {
          "content-type": contentType,
          "cache-control": "public, max-age=31536000, immutable",
        },
      });
    } catch (error) {
      console.error("[Attachments] Transform failed:", error);
      set.status = 502;
      return { error: "Failed to transform attachment" };
    }
  },
);

export default attachmentServeRoutes;
