/**
 * Server-side encryption for integration credentials stored in the database
 * (shipping API tokens, Google service accounts, ...).
 *
 * - AES-256-GCM (authenticated encryption) with a random 96-bit IV per record.
 * - Output format: "fxenc1.<base64(iv | ciphertext | tag)>"
 * - The key comes from CREDENTIALS_ENCRYPTION_KEY (32 bytes, base64).
 * - NEVER import this module from client components or route handlers with
 *   runtime = "edge".
 */
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";

const PREFIX = "fxenc1.";
const ALGO = "aes-256-gcm";

function getKey(): Buffer {
  const envKey = process.env.CREDENTIALS_ENCRYPTION_KEY;
  if (envKey && Buffer.byteLength(envKey, "base64") === 32) {
    return Buffer.from(envKey, "base64");
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error("CREDENTIALS_ENCRYPTION_KEY (32 bytes, base64) is required in production.");
  }
  // Deterministic development key so local demos work without configuration.
  return createHash("sha256").update("flexigo-dev-key-not-for-production").digest();
}

/** Encrypt a secret for storage. Returns a prefixed, base64 string. */
export function encryptSecret(plaintext: string): string {
  if (!plaintext) return "";
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGO, getKey(), iv);
  const ct = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return PREFIX + Buffer.concat([iv, ct, tag]).toString("base64");
}

/** Decrypt a value produced by encryptSecret. Returns null on failure. */
export function decryptSecret(stored: string | null | undefined): string | null {
  if (!stored) return null;
  if (stored.startsWith(PREFIX)) {
    try {
      const raw = Buffer.from(stored.slice(PREFIX.length), "base64");
      if (raw.length < 12 + 16) return null;
      const iv = raw.subarray(0, 12);
      const tag = raw.subarray(raw.length - 16);
      const ct = raw.subarray(12, raw.length - 16);
      const decipher = createDecipheriv(ALGO, getKey(), iv);
      decipher.setAuthTag(tag);
      return Buffer.concat([decipher.update(ct), decipher.final()]).toString("utf8");
    } catch {
      return null;
    }
  }
  // Legacy plaintext (should not happen): return as-is so we can re-encrypt.
  return stored;
}

/** Whether a stored value is encrypted (or empty). */
export function isEncrypted(stored: string | null | undefined): boolean {
  return !!stored && stored.startsWith(PREFIX);
}

/** Mask a secret for safe display in dashboards: "…abcd". */
export function maskSecret(value: string | null | undefined): string {
  if (!value) return "—";
  const plain = decryptSecret(value);
  if (!plain) return "—";
  return "••••" + plain.slice(-4);
}

/** Constant-time string comparison (tokens, verification codes). */
export function safeEqual(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

/** Generate a random verification token (DNS TXT record value). */
export function generateToken(bytes = 24): string {
  return randomBytes(bytes).toString("hex");
}
