import { NextResponse } from "next/server";
import { safeCompareStrings } from "@/lib/crypto";
import { getServerEnv } from "@/lib/env";
import { cleanupExpiredBouquets } from "@/lib/repository";

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const env = getServerEnv();
    const authHeader = request.headers.get("authorization") ?? "";
    const expectedHeader = `Bearer ${env.CRON_SECRET}`;

    if (!safeCompareStrings(authHeader, expectedHeader)) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const result = await cleanupExpiredBouquets(90);

    return NextResponse.json(
      {
        ok: true,
        retentionDays: 90,
        deletedBouquets: result.deletedBouquets,
        deletedImages: result.deletedImages,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[GET /api/cron/cleanup] Cleanup error:", error);
    return NextResponse.json({ ok: false, error: "Cleanup failed" }, { status: 500 });
  }
}
