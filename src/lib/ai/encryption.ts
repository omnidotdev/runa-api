/**
 * AES-256-GCM encryption/decryption for sensitive data at rest.
 *
 * Used to encrypt org-provided API keys before storing in the database.
 * The encryption key is derived from the ENCRYPTION_SECRET environment variable.
 *
 * Format: base64(iv:ciphertext:authTag)
 *   - iv: 12-byte initialization vector (unique per encryption)
 *   - ciphertext: encrypted data
 *   - authTag: 16-byte authentication tag (prevents tampering)
 */

import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const KEY_LENGTH = 32;

/**
 * Derive a 32-byte encryption key from the environment secret.
 *
 * Uses SHA-256 hash to normalize arbitrary-length secrets into a
 * fixed-length AES-256 key.
 */
function deriveKey(secret: string): Buffer {
  return createHash("sha256").update(secret).digest().subarray(0, KEY_LENGTH);
}

function getEncryptionKey(): Buffer {
  const secret = process.env.ENCRYPTION_SECRET;
  if (!secret) {
    throw new Error(
      "ENCRYPTION_SECRET environment variable is required for API key encryption.",
    );
  }
  return deriveKey(secret);
}

/**
 * Encrypt a plaintext string using AES-256-GCM.
 *
 * @returns Base64-encoded string containing IV, ciphertext, and auth tag.
 */
export function encrypt(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);

  const cipher = createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  // Concatenate: iv + ciphertext + authTag
  const combined = Buffer.concat([iv, encrypted, authTag]);
  return combined.toString("base64");
}

/**
 * Decrypt a base64-encoded AES-256-GCM ciphertext.
 *
 * @returns The original plaintext string.
 * @throws If the ciphertext is invalid, tampered, or the wrong key is used.
 */
export function decrypt(encoded: string): string {
  const key = getEncryptionKey();
  const combined = Buffer.from(encoded, "base64");

  if (combined.length < IV_LENGTH + AUTH_TAG_LENGTH) {
    throw new Error("Invalid encrypted data: too short.");
  }

  const iv = combined.subarray(0, IV_LENGTH);
  const authTag = combined.subarray(combined.length - AUTH_TAG_LENGTH);
  const ciphertext = combined.subarray(
    IV_LENGTH,
    combined.length - AUTH_TAG_LENGTH,
  );

  const decipher = createDecipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}

/**
 * Mask an API key for display, showing only the last 4 characters.
 *
 * @example maskApiKey("sk-proj-abcdefgh12345") → "sk-...2345"
 */
export function maskApiKey(key: string): string {
  if (key.length <= 8) return "***";
  const prefix = key.startsWith("sk-") ? "sk-" : "";
  const suffix = key.slice(-4);
  return `${prefix}...${suffix}`;
}
