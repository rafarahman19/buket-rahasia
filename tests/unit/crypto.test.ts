import { describe, expect, it } from "vitest";
import {
  hashWithPepper,
  signBlockTokenWithSecret,
  verifyBlockTokenWithSecret,
} from "@/lib/crypto";

const TEST_PEPPER = "unit-test-pepper-at-least-32-characters-long!!";
const TEST_HMAC_SECRET = "unit-test-hmac-secret-at-least-32-chars-long!!";

describe("HMAC block token sign & verify", () => {
  it("signs and verifies a valid email-hash opt-out token", () => {
    const emailHash = hashWithPepper("penerima@contoh.id", TEST_PEPPER, "email");
    const fixedNow = 1_760_000_000_000;

    const token = signBlockTokenWithSecret(emailHash, TEST_HMAC_SECRET, {
      ttlSeconds: 3600,
      nowMs: fixedNow,
    });

    const verified = verifyBlockTokenWithSecret(
      token,
      TEST_HMAC_SECRET,
      fixedNow + 60_000
    );

    expect(verified.valid).toBe(true);
    if (verified.valid) {
      expect(verified.emailHash).toBe(emailHash);
    }
  });

  it("rejects tokens signed with a different secret or tampered payload", () => {
    const emailHash = hashWithPepper("penerima@contoh.id", TEST_PEPPER, "email");
    const otherEmailHash = hashWithPepper("oranglain@contoh.id", TEST_PEPPER, "email");
    const token = signBlockTokenWithSecret(emailHash, TEST_HMAC_SECRET);

    const wrongSecretCheck = verifyBlockTokenWithSecret(
      token,
      "completely-different-hmac-secret-32-chars!!"
    );
    expect(wrongSecretCheck).toEqual({
      valid: false,
      reason: "INVALID_SIGNATURE",
    });

    // Forge payload while keeping original signature
    const [, originalSig] = token.split(".");
    const forgedPayload = Buffer.from(
      JSON.stringify({ v: 1, eh: otherEmailHash, exp: 9_999_999_999 }),
      "utf8"
    ).toString("base64url");
    const forgedToken = `${forgedPayload}.${originalSig}`;

    expect(verifyBlockTokenWithSecret(forgedToken, TEST_HMAC_SECRET)).toEqual({
      valid: false,
      reason: "INVALID_SIGNATURE",
    });
  });

  it("rejects expired tokens", () => {
    const emailHash = hashWithPepper("penerima@contoh.id", TEST_PEPPER, "email");
    const startMs = 1_760_000_000_000;
    const token = signBlockTokenWithSecret(emailHash, TEST_HMAC_SECRET, {
      ttlSeconds: 60,
      nowMs: startMs,
    });

    const expiredCheck = verifyBlockTokenWithSecret(
      token,
      TEST_HMAC_SECRET,
      startMs + 61_000
    );
    expect(expiredCheck).toEqual({
      valid: false,
      reason: "EXPIRED",
    });
  });

  it("domain-separates email hashes from IP hashes", () => {
    const asEmail = hashWithPepper("same-input", TEST_PEPPER, "email");
    const asIp = hashWithPepper("same-input", TEST_PEPPER, "ip");
    expect(asEmail).toHaveLength(64);
    expect(asIp).toHaveLength(64);
    expect(asEmail).not.toBe(asIp);
  });
});
