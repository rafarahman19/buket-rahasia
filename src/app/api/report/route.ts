import { NextResponse } from "next/server";
import { hashWithPepper } from "@/lib/crypto";
import { getServerEnv } from "@/lib/env";
import { enforceActionRateLimit } from "@/lib/rate-limit";
import { reportBouquetById } from "@/lib/repository";
import { extractClientIp, verifyRequestOrigin } from "@/lib/security";
import { reportRequestSchema } from "@/lib/validation";

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const env = getServerEnv();

    if (!verifyRequestOrigin(request, env.NEXT_PUBLIC_APP_URL)) {
      return NextResponse.json(
        { ok: false, error: "Permintaan tidak diizinkan (Origin tidak sesuai)." },
        { status: 403 }
      );
    }

    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return NextResponse.json(
        { ok: false, error: "Format laporan tidak valid." },
        { status: 400 }
      );
    }

    const parsed = reportRequestSchema.safeParse(rawBody);
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message ?? "Data laporan tidak valid.";
      return NextResponse.json({ ok: false, error: msg }, { status: 400 });
    }

    const clientIp = extractClientIp(request);
    const reporterIpHash = hashWithPepper(clientIp, env.HASH_PEPPER, "ip");

    const rateLimit = await enforceActionRateLimit("report", reporterIpHash);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { ok: false, error: rateLimit.userMessage },
        {
          status: 429,
          headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
        }
      );
    }

    await reportBouquetById({
      bouquetId: parsed.data.bouquetId,
      reason: parsed.data.reason,
      reporterIpHash,
    });

    // Always return `{ ok: true }` so report endpoint cannot be used to probe bouquet IDs
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error("[POST /api/report] Unexpected server error:", error);
    return NextResponse.json(
      {
        ok: false,
        error: "Maaf, laporan belum dapat diproses saat ini. Coba lagi sebentar ya.",
      },
      { status: 500 }
    );
  }
}
