import { describe, expect, it } from "vitest";
import { hashWithPepper } from "@/lib/crypto";
import {
  buildActionRateLimitKey,
  buildSendRateLimitKeys,
  InMemorySlidingWindowLimiter,
} from "@/lib/rate-limit";

const PEPPER = "rate-limit-test-pepper-at-least-32-characters!";

describe("rate-limit key logic & sliding window enforcement", () => {
  it("constructs distinct, domain-scoped Redis keys for IP and recipient email hashes", () => {
    const ipHash = hashWithPepper("203.0.113.42", PEPPER, "ip");
    const rcptHash = hashWithPepper("sari@contoh.id", PEPPER, "email");

    const keys = buildSendRateLimitKeys(ipHash, rcptHash);
    expect(keys).toEqual({
      ipShort: `rl:send:ip:10m:${ipHash}`,
      ipDaily: `rl:send:ip:24h:${ipHash}`,
      recipientDaily: `rl:send:rcpt:24h:${rcptHash}`,
      recipientWeekly: `rl:send:rcpt:7d:${rcptHash}`,
    });

    expect(buildActionRateLimitKey("report", ipHash)).toBe(`rl:report:ip:1h:${ipHash}`);
    expect(buildActionRateLimitKey("block", ipHash)).toBe(`rl:block:ip:1h:${ipHash}`);
    expect(buildActionRateLimitKey("upload", ipHash)).toBe(`rl:upload:ip:10m:${ipHash}`);
  });

  it("rejects raw IP addresses or plain emails so PII can never enter Redis keys", () => {
    const validHash = hashWithPepper("203.0.113.42", PEPPER, "ip");

    expect(() => buildSendRateLimitKeys("203.0.113.42", validHash)).toThrow();
    expect(() => buildSendRateLimitKeys(validHash, "raw@contoh.id")).toThrow();
    expect(() => buildActionRateLimitKey("report", "127.0.0.1")).toThrow();
  });

  it("enforces sliding-window quotas and recovers after the window elapses", () => {
    const limiter = new InMemorySlidingWindowLimiter();
    const ipHash = hashWithPepper("198.51.100.10", PEPPER, "ip");
    const key = `rl:send:ip:10m:${ipHash}`;
    const tenMinutesMs = 10 * 60 * 1000;
    const t0 = 1_760_000_000_000;

    expect(limiter.check(key, 3, tenMinutesMs, t0).success).toBe(true);
    expect(limiter.check(key, 3, tenMinutesMs, t0 + 1_000).success).toBe(true);
    expect(limiter.check(key, 3, tenMinutesMs, t0 + 2_000).success).toBe(true);

    // 4th send within 10 minutes is blocked
    const fourth = limiter.check(key, 3, tenMinutesMs, t0 + 3_000);
    expect(fourth.success).toBe(false);

    // Once 10 minutes pass after the first hit, 1 slot opens again
    const afterWindow = limiter.check(key, 3, tenMinutesMs, t0 + tenMinutesMs + 10);
    expect(afterWindow.success).toBe(true);
  });
});
