import { NextResponse } from "next/server";
import { hashWithPepper, verifyBlockTokenWithSecret } from "@/lib/crypto";
import { getServerEnv } from "@/lib/env";
import { enforceActionRateLimit } from "@/lib/rate-limit";
import { addBlockedRecipientHash } from "@/lib/repository";
import { extractClientIp, verifyRequestOrigin } from "@/lib/security";
import { blockRequestSchema } from "@/lib/validation";

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const env = getServerEnv();
    const url = new URL(request.url);
    const queryToken = url.searchParams.get("token");
    const contentType = (request.headers.get("content-type") ?? "").toLowerCase();

    let tokenToVerify: string | null = null;

    // Support RFC 8058 One-Click List-Unsubscribe POST directly from mail clients
    // (`POST /api/block?token=...` with `List-Unsubscribe=One-Click`) as well as
    // standard same-origin JSON POST from `/blokir`.
    if (queryToken && !contentType.includes("application/json")) {
      // Browser requests always send an Origin header; verify same-origin if present.
      // Server-to-server RFC 8058 mail-client unsubscribes omit Origin and send
      // `List-Unsubscribe=One-Click` in the POST body.
      if (request.headers.get("origin")) {
        if (!verifyRequestOrigin(request, env.NEXT_PUBLIC_APP_URL)) {
          return NextResponse.json(
            { ok: false, error: "Permintaan tidak diizinkan (Origin tidak sesuai)." },
            { status: 403 }
          );
        }
      } else {
        const rawFormBody = await request.text();
        if (!rawFormBody.includes("List-Unsubscribe=One-Click")) {
          return NextResponse.json(
            { ok: false, error: "Header Origin atau body One-Click wajib disertakan." },
            { status: 403 }
          );
        }
      }

      const parsed = blockRequestSchema.safeParse({ token: queryToken });
      if (!parsed.success) {
        return NextResponse.json(
          { ok: false, error: "Token berhenti berlangganan tidak valid." },
          { status: 400 }
        );
      }
      tokenToVerify = parsed.data.token;
    } else {
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
          { ok: false, error: "Format permintaan tidak valid." },
          { status: 400 }
        );
      }

      const parsed = blockRequestSchema.safeParse(rawBody);
      if (!parsed.success) {
        const msg = parsed.error.issues[0]?.message ?? "Token tidak valid.";
        return NextResponse.json({ ok: false, error: msg }, { status: 400 });
      }
      tokenToVerify = parsed.data.token;
    }

    const clientIp = extractClientIp(request);
    const ipHash = hashWithPepper(clientIp, env.HASH_PEPPER, "ip");

    const rateLimit = await enforceActionRateLimit("block", ipHash);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { ok: false, error: rateLimit.userMessage },
        {
          status: 429,
          headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
        }
      );
    }

    const verified = verifyBlockTokenWithSecret(tokenToVerify, env.HMAC_SECRET);
    if (!verified.valid) {
      const friendlyError =
        verified.reason === "EXPIRED"
          ? "Tautan pemblokiran ini sudah kedaluwarsa."
          : "Tautan pemblokiran tidak valid atau sudah rusak.";
      return NextResponse.json({ ok: false, error: friendlyError }, { status: 400 });
    }

    await addBlockedRecipientHash(verified.emailHash);

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error("[POST /api/block] Unexpected server error:", error);
    return NextResponse.json(
      {
        ok: false,
        error:
          "Maaf, terjadi kendala saat memproses permintaanmu. Coba lagi sebentar ya.",
      },
      { status: 500 }
    );
  }
}
