import { createHash, createHmac, timingSafeEqual } from "node:crypto";

const SHA256_HEX_REGEX = /^[a-f0-9]{64}$/;
const DEFAULT_BLOCK_TOKEN_TTL_SECONDS = 90 * 24 * 60 * 60; // 90 days

interface BlockTokenPayload {
  v: 1;
  eh: string;
  exp: number;
}

/**
 * Computes a one-way SHA-256 hex digest mixed with a server-side secret pepper.
 */
export function hashWithPepper(
  normalizedValue: string,
  pepper: string,
  domainTag: "email" | "ip"
): string {
  if (!pepper || pepper.length < 16) {
    throw new Error("HASH_PEPPER must be at least 16 characters.");
  }
  return createHash("sha256")
    .update(`${domainTag}:${pepper}:${normalizedValue.trim().toLowerCase()}`, "utf8")
    .digest("hex");
}

/**
 * Constant-time string equality check using SHA-256 normalization to avoid length leaks.
 */
export function safeCompareStrings(a: string, b: string): boolean {
  const digestA = createHash("sha256").update(a, "utf8").digest();
  const digestB = createHash("sha256").update(b, "utf8").digest();
  return timingSafeEqual(digestA, digestB) && a.length === b.length;
}

function computeHmacBase64Url(payloadB64: string, secret: string): string {
  return createHmac("sha256", secret).update(payloadB64, "utf8").digest("base64url");
}

/**
 * Signs an email hash and expiry timestamp into a tamper-proof URL-safe token.
 */
export function signBlockTokenWithSecret(
  emailHash: string,
  secret: string,
  options?: { ttlSeconds?: number; nowMs?: number }
): string {
  if (!SHA256_HEX_REGEX.test(emailHash)) {
    throw new Error("Invalid SHA-256 email hash.");
  }
  if (!secret || secret.length < 16) {
    throw new Error("HMAC_SECRET must be at least 16 characters.");
  }

  const nowSeconds = Math.floor((options?.nowMs ?? Date.now()) / 1000);
  const ttlSeconds = options?.ttlSeconds ?? DEFAULT_BLOCK_TOKEN_TTL_SECONDS;
  const payload: BlockTokenPayload = {
    v: 1,
    eh: emailHash,
    exp: nowSeconds + ttlSeconds,
  };

  const payloadB64 = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const signatureB64 = computeHmacBase64Url(payloadB64, secret);
  return `${payloadB64}.${signatureB64}`;
}

export type VerifyBlockTokenResult =
  | { valid: true; emailHash: string; expiresAt: number }
  | {
      valid: false;
      reason: "MALFORMED" | "INVALID_SIGNATURE" | "EXPIRED" | "INVALID_PAYLOAD";
    };

/**
 * Verifies an HMAC-signed block/unsubscribe token using constant-time signature checks.
 */
export function verifyBlockTokenWithSecret(
  token: string,
  secret: string,
  nowMs: number = Date.now()
): VerifyBlockTokenResult {
  if (!token || typeof token !== "string") {
    return { valid: false, reason: "MALFORMED" };
  }

  const parts = token.trim().split(".");
  if (parts.length !== 2) {
    return { valid: false, reason: "MALFORMED" };
  }

  const [payloadB64, providedSigB64] = parts;
  if (!payloadB64 || !providedSigB64) {
    return { valid: false, reason: "MALFORMED" };
  }

  const expectedSigB64 = computeHmacBase64Url(payloadB64, secret);
  const expectedBuf = Buffer.from(expectedSigB64, "utf8");
  const providedBuf = Buffer.from(providedSigB64, "utf8");

  if (
    expectedBuf.length !== providedBuf.length ||
    !timingSafeEqual(expectedBuf, providedBuf)
  ) {
    return { valid: false, reason: "INVALID_SIGNATURE" };
  }

  let parsed: unknown;
  try {
    const jsonStr = Buffer.from(payloadB64, "base64url").toString("utf8");
    parsed = JSON.parse(jsonStr);
  } catch {
    return { valid: false, reason: "INVALID_PAYLOAD" };
  }

  if (
    !parsed ||
    typeof parsed !== "object" ||
    (parsed as BlockTokenPayload).v !== 1 ||
    typeof (parsed as BlockTokenPayload).eh !== "string" ||
    !SHA256_HEX_REGEX.test((parsed as BlockTokenPayload).eh) ||
    typeof (parsed as BlockTokenPayload).exp !== "number" ||
    !Number.isFinite((parsed as BlockTokenPayload).exp)
  ) {
    return { valid: false, reason: "INVALID_PAYLOAD" };
  }

  const payload = parsed as BlockTokenPayload;
  const nowSeconds = Math.floor(nowMs / 1000);
  if (payload.exp <= nowSeconds) {
    return { valid: false, reason: "EXPIRED" };
  }

  return {
    valid: true,
    emailHash: payload.eh,
    expiresAt: payload.exp,
  };
}
