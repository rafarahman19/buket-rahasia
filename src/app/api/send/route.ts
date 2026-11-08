import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { hashWithPepper, signBlockTokenWithSecret } from "@/lib/crypto";
import { getServerEnv } from "@/lib/env";
import { sendBouquetInviteEmail } from "@/lib/mailer";
import { moderateSubmission, stripUrls } from "@/lib/moderation";
import { enforceSendRateLimits } from "@/lib/rate-limit";
import {
  buildPublicPreviewUrl,
  deleteBouquetById,
  deletePreviewPngs,
  insertBouquetRecord,
  isIpHashBanned,
  isRecipientEmailHashBlocked,
} from "@/lib/repository";
import { extractClientIp, verifyRequestOrigin } from "@/lib/security";
import { verifyTurnstileToken } from "@/lib/turnstile";
import { previewPathSchema, sendBouquetRequestSchema } from "@/lib/validation";

async function safeCleanupPreview(rawBody: unknown): Promise<void> {
  if (!rawBody || typeof rawBody !== "object") return;
  const candidate = (rawBody as Record<string, unknown>).previewPath;
  const parsed = previewPathSchema.safeParse(candidate);
  if (parsed.success) {
    try {
      await deletePreviewPngs([parsed.data]);
    } catch {
      // Ignore cleanup failures
    }
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  let rawBody: unknown = null;

  try {
    const env = getServerEnv();

    if (!verifyRequestOrigin(request, env.NEXT_PUBLIC_APP_URL)) {
      return NextResponse.json(
        { ok: false, error: "Permintaan tidak diizinkan (Origin tidak sesuai)." },
        { status: 403 }
      );
    }

    try {
      rawBody = await request.json();
    } catch {
      return NextResponse.json(
        { ok: false, error: "Format data permintaan tidak valid." },
        { status: 400 }
      );
    }

    const parsed = sendBouquetRequestSchema.safeParse(rawBody);
    if (!parsed.success) {
      await safeCleanupPreview(rawBody);
      const firstIssue =
        parsed.error.issues[0]?.message ?? "Periksa kembali isian formulirmu ya.";
      return NextResponse.json({ ok: false, error: firstIssue }, { status: 400 });
    }

    const input = parsed.data;
    const clientIp = extractClientIp(request);
    const senderIpHash = hashWithPepper(clientIp, env.HASH_PEPPER, "ip");
    const recipientEmailHash = hashWithPepper(
      input.recipientEmail,
      env.HASH_PEPPER,
      "email"
    );

    // 1. Check IP-hash abuse banlist
    if (await isIpHashBanned(senderIpHash)) {
      await deletePreviewPngs([input.previewPath]);
      return NextResponse.json(
        {
          ok: false,
          error:
            "Maaf, pengiriman dari jaringan ini telah dibatasi karena pelanggaran ketentuan layanan.",
        },
        { status: 403 }
      );
    }

    // 2. Content moderation (reject URLs, threats, and slurs; log hashed IDs only)
    const moderation = moderateSubmission({
      message: input.message,
      signoff: input.signoff,
      recipientName: input.recipientName,
    });
    if (!moderation.allowed) {
      console.warn("[Moderation] Rejected bouquet submission", {
        code: moderation.code,
        senderIpHashPrefix: senderIpHash.slice(0, 16),
        recipientHashPrefix: recipientEmailHash.slice(0, 16),
      });
      await deletePreviewPngs([input.previewPath]);
      return NextResponse.json(
        { ok: false, error: moderation.userMessage },
        { status: 400 }
      );
    }

    // 3. Server-side Cloudflare Turnstile verification
    const turnstileOk = await verifyTurnstileToken(input.turnstileToken, clientIp);
    if (!turnstileOk) {
      await deletePreviewPngs([input.previewPath]);
      return NextResponse.json(
        {
          ok: false,
          error:
            "Verifikasi anti-bot gagal atau kedaluwarsa. Silakan ulangi sebentar ya.",
        },
        { status: 400 }
      );
    }

    // 4. Distributed sliding-window rate limits (per IP & per recipient email hash)
    const rateLimit = await enforceSendRateLimits(senderIpHash, recipientEmailHash);
    if (!rateLimit.allowed) {
      await deletePreviewPngs([input.previewPath]);
      return NextResponse.json(
        { ok: false, error: rateLimit.userMessage },
        {
          status: 429,
          headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
        }
      );
    }

    // 5. Recipient opt-out blocklist check.
    // Silently drop without storing or emailing while returning `{ ok: true }`
    // so harassers cannot probe whether a recipient blocked Buket Rahasia.
    if (await isRecipientEmailHashBlocked(recipientEmailHash)) {
      await deletePreviewPngs([input.previewPath]);
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    // 6. Persist bouquet with unguessable 24-char nanoid and defense-in-depth URL stripping
    const bouquetId = nanoid(24);
    const cleanMessage = stripUrls(input.message);
    const cleanSignoff = input.signoff ? stripUrls(input.signoff) : null;
    const cleanRecipientName = input.recipientName
      ? stripUrls(input.recipientName)
      : null;

    await insertBouquetRecord({
      id: bouquetId,
      bouquetJson: input.bouquet,
      message: cleanMessage,
      signoff: cleanSignoff,
      recipientName: cleanRecipientName,
      previewPath: input.previewPath,
      recipientEmailHash,
      senderIpHash,
    });

    // 7. Render & send email via Resend; rollback record if delivery fails
    const previewImageUrl = buildPublicPreviewUrl(input.previewPath);
    const signedBlockToken = signBlockTokenWithSecret(
      recipientEmailHash,
      env.HMAC_SECRET
    );

    try {
      await sendBouquetInviteEmail({
        toEmail: input.recipientEmail,
        recipientName: cleanRecipientName,
        bouquetId,
        previewImageUrl,
        signedBlockToken,
      });
    } catch (emailErr) {
      console.error("[POST /api/send] Email delivery failed; rolling back:", emailErr);
      await Promise.allSettled([
        deleteBouquetById(bouquetId),
        deletePreviewPngs([input.previewPath]),
      ]);
      return NextResponse.json(
        {
          ok: false,
          error:
            "Maaf, layanan email sedang sibuk sehingga buket belum terkirim. Coba lagi sebentar ya.",
        },
        { status: 502 }
      );
    }

    // Never return bouquetId or recipient data to the sender
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error("[POST /api/send] Unexpected server error:", error);
    await safeCleanupPreview(rawBody);
    return NextResponse.json(
      {
        ok: false,
        error: "Terjadi kendala pada server kami. Silakan coba beberapa saat lagi ya.",
      },
      { status: 500 }
    );
  }
}
