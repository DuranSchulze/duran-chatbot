import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scryptSync,
} from "node:crypto";

// AES-256-GCM encryption for provider secrets (API keys / SMTP passwords) stored
// at rest. The key is derived from a server-side secret so plaintext keys never
// touch the database or any client response.

const SALT = "duran-chatbot-email-integration-v1";

function getKey(): Buffer {
  const secret =
    process.env.EMAIL_ENCRYPTION_KEY || process.env.AUTH_JWT_SECRET || "";
  if (!secret) {
    throw new Error(
      "EMAIL_ENCRYPTION_KEY (or AUTH_JWT_SECRET) must be set to store email credentials",
    );
  }
  return scryptSync(secret, SALT, 32);
}

/** Encrypt plaintext → "iv:tag:ciphertext" (all base64). */
export function encryptSecret(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getKey(), iv);
  const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64")}:${tag.toString("base64")}:${enc.toString("base64")}`;
}

/** Decrypt "iv:tag:ciphertext" produced by encryptSecret. Returns "" if malformed. */
export function decryptSecret(payload: string | null | undefined): string {
  if (!payload) return "";
  const parts = payload.split(":");
  if (parts.length !== 3) return "";
  const [ivB64, tagB64, dataB64] = parts;
  try {
    const decipher = createDecipheriv(
      "aes-256-gcm",
      getKey(),
      Buffer.from(ivB64, "base64"),
    );
    decipher.setAuthTag(Buffer.from(tagB64, "base64"));
    const dec = Buffer.concat([
      decipher.update(Buffer.from(dataB64, "base64")),
      decipher.final(),
    ]);
    return dec.toString("utf8");
  } catch {
    return "";
  }
}
