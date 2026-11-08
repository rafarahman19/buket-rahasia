import "server-only";
import fs from "node:fs";
import path from "node:path";
import * as React from "react";
import { render } from "@react-email/render";
import { Resend } from "resend";
import {
  BouquetInviteEmail,
  buildBouquetInvitePlainText,
  FIXED_EMAIL_SUBJECT,
} from "@/emails/BouquetInviteEmail";
import { getServerEnv, isE2EMockMode } from "./env";

let cachedResend: Resend | null = null;

function getResendClient(): Resend {
  if (cachedResend) {
    return cachedResend;
  }
  const env = getServerEnv();
  cachedResend = new Resend(env.RESEND_API_KEY);
  return cachedResend;
}

export interface SendBouquetEmailParams {
  toEmail: string;
  recipientName: string | null;
  bouquetId: string;
  previewImageUrl: string;
  signedBlockToken: string;
}

/**
 * Renders the React Email HTML + plain-text alternative and delivers via Resend.
 * - Uses fixed `EMAIL_FROM` and fixed `FIXED_EMAIL_SUBJECT` (zero user input in headers).
 * - Adds RFC 2369 / RFC 8058 `List-Unsubscribe` and `List-Unsubscribe-Post` headers.
 */
export async function sendBouquetInviteEmail(
  params: SendBouquetEmailParams
): Promise<void> {
  const env = getServerEnv();
  const baseUrl = env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");

  const revealUrl = `${baseUrl}/b/${encodeURIComponent(params.bouquetId)}`;
  const reportUrl = `${revealUrl}?lapor=1`;
  const blockPageUrl = `${baseUrl}/blokir?token=${encodeURIComponent(params.signedBlockToken)}`;
  const oneClickBlockApiUrl = `${baseUrl}/api/block?token=${encodeURIComponent(params.signedBlockToken)}`;

  const html = await render(
    React.createElement(BouquetInviteEmail, {
      recipientName: params.recipientName,
      previewImageUrl: params.previewImageUrl,
      revealUrl,
      reportUrl,
      blockUrl: blockPageUrl,
    })
  );

  const text = buildBouquetInvitePlainText({
    recipientName: params.recipientName,
    revealUrl,
    reportUrl,
    blockUrl: blockPageUrl,
  });

  const headers = {
    "List-Unsubscribe": `<${oneClickBlockApiUrl}>, <${blockPageUrl}>`,
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
  };

  if (isE2EMockMode()) {
    const outboxDir = path.join(process.cwd(), ".e2e-outbox");
    fs.mkdirSync(outboxDir, { recursive: true });
    fs.writeFileSync(
      path.join(outboxDir, "latest-email.json"),
      JSON.stringify(
        {
          from: env.EMAIL_FROM,
          to: params.toEmail,
          subject: FIXED_EMAIL_SUBJECT,
          revealUrl,
          reportUrl,
          blockPageUrl,
          previewImageUrl: params.previewImageUrl,
          headers,
          html,
          text,
          sentAt: new Date().toISOString(),
        },
        null,
        2
      ),
      "utf8"
    );
    return;
  }

  const resend = getResendClient();
  const { error } = await resend.emails.send({
    from: env.EMAIL_FROM,
    to: [params.toEmail],
    subject: FIXED_EMAIL_SUBJECT,
    html,
    text,
    headers,
  });

  if (error) {
    console.error("[Resend] Failed to send email:", error.name, error.message);
    throw new Error("Failed to deliver bouquet email.");
  }
}
