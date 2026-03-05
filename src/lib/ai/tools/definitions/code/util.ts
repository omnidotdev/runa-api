/**
 * Shared utilities for code execution tools.
 */

/**
 * Sanitize a file path to prevent directory traversal attacks.
 * Strips `../` sequences and ensures the path stays within /workspace.
 */
export function sanitizePath(path: string): string {
  // Remove all directory traversal sequences
  let sanitized = path.replace(/\.\.\//g, "").replace(/\.\.\\/g, "");

  // Remove leading slashes (paths should be relative to /workspace)
  sanitized = sanitized.replace(/^\/+/, "");

  // Prevent empty path
  if (!sanitized || sanitized === ".") {
    return ".";
  }

  return sanitized;
}
