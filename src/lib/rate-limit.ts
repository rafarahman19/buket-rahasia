import "server-only";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { getServerEnv, isE2EMockMode } from "./env";

const SHA256_HEX_REGEX = /^[a-f0-9]{64}$/;

export interface SendRateLimitKeys {
  ipShort: string;
  ipDaily: string;
  recipientDaily: string;
  recipientWeekly: string;
}

export type AuxiliaryRateLimitAction = "upload" | "report" | "block";

function assertSha256Hex(hash: string, label: string): void {
  if (!SHA256_HEX_REGEX.test(hash)) {
    throw new Error(`${label} must be a 64-character lowercase hex SHA-256 hash.`);
  }
}

/**
 * Builds deterministic, privacy-preserving Redis keys for `/api/send`.
 * Raw IPs and plain emails are rejected so Upstash Redis never stores PII.
 */
export function buildSendRateLimitKeys(
  ipHash: string,
  recipientEmailHash: string
): SendRateLimitKeys {
  assertSha256Hex(ipHash, "ipHash");
  assertSha256Hex(recipientEmailHash, "recipientEmailHash");

  return {
    ipShort: `rl:send:ip:10m:${ipHash}`,
    ipDaily: `rl:send:ip:24h:${ipHash}`,
    recipientDaily: `rl:send:rcpt:24h:${recipientEmailHash}`,
    recipientWeekly: `rl:send:rcpt:7d:${recipientEmailHash}`,
  };
}

/**
 * Builds deterministic, privacy-preserving Redis keys for auxiliary routes.
 */
export function buildActionRateLimitKey(
  action: AuxiliaryRateLimitAction,
  ipHash: string
): string {
  assertSha256Hex(ipHash, "ipHash");
  const windowTag = action === "upload" ? "10m" : "1h";
  return `rl:${action}:ip:${windowTag}:${ipHash}`;
}

export interface RateLimitCheckResult {
  allowed: boolean;
  retryAfterSeconds: number;
  userMessage?: string;
}

/**
 * Pure sliding-window rate limiter used in local E2E mock mode and unit tests.
 */
export class InMemorySlidingWindowLimiter {
  private readonly hits = new Map<string, number[]>();

  check(
    key: string,
    maxRequests: number,
    windowMs: number,
    nowMs: number = Date.now()
  ): { success: boolean; resetMs: number } {
    const cutoff = nowMs - windowMs;
    const timestamps = (this.hits.get(key) ?? []).filter((ts) => ts > cutoff);

    if (timestamps.length >= maxRequests) {
      const oldest = timestamps[0] ?? nowMs;
      return {
        success: false,
        resetMs: oldest + windowMs,
      };
    }

    timestamps.push(nowMs);
    this.hits.set(key, timestamps);
    return {
      success: true,
      resetMs: nowMs + windowMs,
    };
  }
}

const e2eMemoryLimiter = new InMemorySlidingWindowLimiter();

interface UpstashLimiters {
  sendIp10m: Ratelimit;
  sendIp24h: Ratelimit;
  sendRcpt24h: Ratelimit;
  sendRcpt7d: Ratelimit;
  uploadIp10m: Ratelimit;
  reportIp1h: Ratelimit;
  blockIp1h: Ratelimit;
}

let cachedUpstashLimiters: UpstashLimiters | null = null;

function getUpstashLimiters(): UpstashLimiters {
  if (cachedUpstashLimiters) {
    return cachedUpstashLimiters;
  }

  const env = getServerEnv();
  const redis = new Redis({
    url: env.UPSTASH_REDIS_REST_URL,
    token: env.UPSTASH_REDIS_REST_TOKEN,
  });

  cachedUpstashLimiters = {
    sendIp10m: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(3, "10 m"),
      prefix: "buket",
      analytics: false,
    }),
    sendIp24h: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, "24 h"),
      prefix: "buket",
      analytics: false,
    }),
    sendRcpt24h: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(2, "24 h"),
      prefix: "buket",
      analytics: false,
    }),
    sendRcpt7d: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, "7 d"),
      prefix: "buket",
      analytics: false,
    }),
    uploadIp10m: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(12, "10 m"),
      prefix: "buket",
      analytics: false,
    }),
    reportIp1h: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, "1 h"),
      prefix: "buket",
      analytics: false,
    }),
    blockIp1h: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, "1 h"),
      prefix: "buket",
      analytics: false,
    }),
  };

  return cachedUpstashLimiters;
}

async function runWindowCheck(
  limiterName: keyof UpstashLimiters,
  key: string,
  maxRequests: number,
  windowMs: number
): Promise<{ success: boolean; retryAfterSeconds: number }> {
  const now = Date.now();
  if (isE2EMockMode()) {
    const res = e2eMemoryLimiter.check(key, maxRequests, windowMs, now);
    return {
      success: res.success,
      retryAfterSeconds: Math.max(1, Math.ceil((res.resetMs - now) / 1000)),
    };
  }

  const limiters = getUpstashLimiters();
  const res = await limiters[limiterName].limit(key);
  return {
    success: res.success,
    retryAfterSeconds: Math.max(1, Math.ceil((res.reset - now) / 1000)),
  };
}

export async function enforceSendRateLimits(
  ipHash: string,
  recipientEmailHash: string
): Promise<RateLimitCheckResult> {
  const keys = buildSendRateLimitKeys(ipHash, recipientEmailHash);

  // 1. Per IP: 3 sends per 10 minutes
  const ip10m = await runWindowCheck("sendIp10m", keys.ipShort, 3, 10 * 60 * 1000);
  if (!ip10m.success) {
    return {
      allowed: false,
      retryAfterSeconds: ip10m.retryAfterSeconds,
      userMessage:
        "Kamu sudah mengirim beberapa buket dalam 10 menit terakhir. Tunggu sebentar sebelum mengirim lagi ya 🌸",
    };
  }

  // 2. Per IP: 10 sends per 24 hours
  const ip24h = await runWindowCheck("sendIp24h", keys.ipDaily, 10, 24 * 60 * 60 * 1000);
  if (!ip24h.success) {
    return {
      allowed: false,
      retryAfterSeconds: ip24h.retryAfterSeconds,
      userMessage:
        "Batas pengiriman harianmu sudah tercapai (maksimal 10 buket per hari). Lanjut lagi besok ya!",
    };
  }

  // 3. Per Recipient Email Hash: 2 per 24 hours
  const rcpt24h = await runWindowCheck(
    "sendRcpt24h",
    keys.recipientDaily,
    2,
    24 * 60 * 60 * 1000
  );
  if (!rcpt24h.success) {
    return {
      allowed: false,
      retryAfterSeconds: rcpt24h.retryAfterSeconds,
      userMessage:
        "Penerima ini sudah cukup menerima buket hari ini. Coba kirim lagi besok supaya tetap nyaman ya.",
    };
  }

  // 4. Per Recipient Email Hash: 5 per 7 days
  const rcpt7d = await runWindowCheck(
    "sendRcpt7d",
    keys.recipientWeekly,
    5,
    7 * 24 * 60 * 60 * 1000
  );
  if (!rcpt7d.success) {
    return {
      allowed: false,
      retryAfterSeconds: rcpt7d.retryAfterSeconds,
      userMessage:
        "Penerima ini sudah mencapai batas penerimaan buket minggu ini. Coba lagi beberapa hari ke depan ya.",
    };
  }

  return { allowed: true, retryAfterSeconds: 0 };
}

export async function enforceActionRateLimit(
  action: AuxiliaryRateLimitAction,
  ipHash: string
): Promise<RateLimitCheckResult> {
  const key = buildActionRateLimitKey(action, ipHash);

  if (action === "upload") {
    const res = await runWindowCheck("uploadIp10m", key, 12, 10 * 60 * 1000);
    if (!res.success) {
      return {
        allowed: false,
        retryAfterSeconds: res.retryAfterSeconds,
        userMessage:
          "Terlalu banyak percobaan unggah gambar dalam waktu singkat. Coba lagi beberapa menit lagi ya.",
      };
    }
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (action === "report") {
    const res = await runWindowCheck("reportIp1h", key, 5, 60 * 60 * 1000);
    if (!res.success) {
      return {
        allowed: false,
        retryAfterSeconds: res.retryAfterSeconds,
        userMessage:
          "Kamu sudah mengirim cukup banyak laporan jam ini. Terima kasih, coba lagi nanti ya.",
      };
    }
    return { allowed: true, retryAfterSeconds: 0 };
  }

  const res = await runWindowCheck("blockIp1h", key, 10, 60 * 60 * 1000);
  if (!res.success) {
    return {
      allowed: false,
      retryAfterSeconds: res.retryAfterSeconds,
      userMessage:
        "Terlalu banyak permintaan dalam waktu singkat. Silakan coba lagi sebentar lagi ya.",
    };
  }
  return { allowed: true, retryAfterSeconds: 0 };
}
