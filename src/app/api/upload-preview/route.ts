import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { hashWithPepper } from "@/lib/crypto";
import { getServerEnv } from "@/lib/env";
import { enforceActionRateLimit } from "@/lib/rate-limit";
import { isIpHashBanned, uploadPreviewPng } from "@/lib/repository";
import {
  extractClientIp,
  MAX_PREVIEW_PNG_BYTES,
  validatePngMagicBytes,
  verifyRequestOrigin,
} from "@/lib/security";

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const env = getServerEnv();

    if (!verifyRequestOrigin(request, env.NEXT_PUBLIC_APP_URL)) {
      return NextResponse.json(
        { ok: false, error: "Permintaan tidak diizinkan (Origin tidak sesuai)." },
        { status: 403 }
      );
    }

    const clientIp = extractClientIp(request);
    const ipHash = hashWithPepper(clientIp, env.HASH_PEPPER, "ip");

    if (await isIpHashBanned(ipHash)) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Maaf, akses pengiriman dari jaringan ini telah dibatasi karena pelanggaran ketentuan layanan.",
        },
        { status: 403 }
      );
    }

    const rateLimit = await enforceActionRateLimit("upload", ipHash);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { ok: false, error: rateLimit.userMessage },
        {
          status: 429,
          headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
        }
      );
    }

    const contentType = (request.headers.get("content-type") ?? "").toLowerCase();
    if (!contentType.startsWith("image/png")) {
      return NextResponse.json(
        { ok: false, error: "Format gambar pratinjau harus berupa PNG." },
        { status: 415 }
      );
    }

    const declaredLength = Number(request.headers.get("content-length") ?? "0");
    if (Number.isFinite(declaredLength) && declaredLength > MAX_PREVIEW_PNG_BYTES) {
      return NextResponse.json(
        { ok: false, error: "Ukuran gambar pratinjau melebihi batas 500 KB." },
        { status: 413 }
      );
    }

    const arrayBuffer = await request.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    const pngCheck = validatePngMagicBytes(bytes);
    if (!pngCheck.valid) {
      return NextResponse.json({ ok: false, error: pngCheck.error }, { status: 400 });
    }

    const filename = `${nanoid(24)}.png`;
    const previewPath = await uploadPreviewPng(filename, bytes);

    return NextResponse.json({ ok: true, previewPath }, { status: 200 });
  } catch (error) {
    console.error("[POST /api/upload-preview] Internal error:", error);
    return NextResponse.json(
      {
        ok: false,
        error: "Gagal mengunggah gambar pratinjau buket. Coba beberapa saat lagi ya.",
      },
      { status: 500 }
    );
  }
}
