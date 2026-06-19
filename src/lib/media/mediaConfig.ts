/**
 * Attachment media configuration (server authoritative).
 *
 * Mirrors the client-side advisory config in runa-app's `lib/media/mediaConfig`.
 * This copy is the source of truth for what is actually accepted; client checks
 * only improve UX.
 */

/** High-level media kind for an attachment, drives client rendering */
type MediaKind = "image" | "video" | "file";

/** Bytes in a megabyte */
const MB = 1024 * 1024;

/** Image MIME types that get inline previews + thumbnails (raster only) */
const IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
]);

/** Video MIME types that get inline previews */
const VIDEO_MIME_TYPES = new Set([
  "video/mp4",
  "video/webm",
  "video/quicktime",
]);

/** Per-kind size limits */
const MAX_BYTES: Record<MediaKind, number> = {
  image: 20 * MB,
  video: 50 * MB,
  file: 25 * MB,
};

/**
 * MIME types we refuse outright (executables / scripts), even as generic files,
 * to avoid hosting obviously dangerous payloads.
 */
const BLOCKED_MIME_TYPES = new Set([
  "application/x-msdownload",
  "application/x-msdos-program",
  "application/x-sh",
  "application/x-csh",
  "application/x-executable",
  "application/vnd.microsoft.portable-executable",
  "application/x-elf",
]);

/** File extension (no dot) for common MIME types when building a storage key */
const EXTENSION_BY_MIME_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
  "application/pdf": "pdf",
  "text/plain": "txt",
  "text/csv": "csv",
  "text/markdown": "md",
  "application/json": "json",
  "application/zip": "zip",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    "docx",
  "application/vnd.ms-excel": "xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  "application/vnd.ms-powerpoint": "ppt",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation":
    "pptx",
};

/** Resolve the media kind for a MIME type */
export const kindFromMimeType = (mimeType: string): MediaKind => {
  if (IMAGE_MIME_TYPES.has(mimeType)) return "image";
  if (VIDEO_MIME_TYPES.has(mimeType)) return "video";
  return "file";
};

/**
 * File extension (no dot) for a MIME type. Falls back to the sanitized subtype
 * (e.g. `application/pdf` -> `pdf`), then `bin`.
 */
export const extensionForMimeType = (mimeType: string): string => {
  const known = EXTENSION_BY_MIME_TYPE[mimeType];
  if (known) return known;

  const subtype = mimeType.split("/")[1]?.replace(/[^a-z0-9]/gi, "");
  return subtype && subtype.length <= 5 ? subtype.toLowerCase() : "bin";
};

/**
 * Validate a candidate upload. Returns the resolved kind on success, or an error
 * message describing why the file is rejected.
 */
export const validateUpload = (
  mimeType: string,
  fileSize: number,
): { kind: MediaKind } | { error: string } => {
  if (!mimeType) return { error: "Missing content type" };
  if (BLOCKED_MIME_TYPES.has(mimeType))
    return { error: `Blocked file type: ${mimeType}` };
  if (fileSize <= 0) return { error: "Empty file" };

  const kind = kindFromMimeType(mimeType);
  const maxBytes = MAX_BYTES[kind];
  if (fileSize > maxBytes) {
    return {
      error: `${kind} exceeds the ${Math.round(maxBytes / MB)}MB limit`,
    };
  }

  return { kind };
};
