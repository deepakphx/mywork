import crypto from "node:crypto";

function getKey() {
  const rawKey = process.env.CREDENTIALS_ENCRYPTION_KEY;
  if (!rawKey) {
    throw new Error("Missing required environment variable: CREDENTIALS_ENCRYPTION_KEY");
  }
  return crypto.createHash("sha256").update(rawKey).digest();
}

export function encryptSecret(plainText: string) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return {
    encryptedSecret: encrypted.toString("base64"),
    iv: iv.toString("base64"),
    authTag: tag.toString("base64"),
  };
}

export function decryptSecret(input: {
  encryptedSecret: string;
  iv: string;
  authTag: string;
}) {
  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    getKey(),
    Buffer.from(input.iv, "base64")
  );
  decipher.setAuthTag(Buffer.from(input.authTag, "base64"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(input.encryptedSecret, "base64")),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}

