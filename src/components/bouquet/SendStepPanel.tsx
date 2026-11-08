"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Lock, Send } from "lucide-react";
import type { BouquetJson } from "@/lib/bouquet-catalog";
import { exportSvgElementToPngBlob } from "@/lib/export-png";
import { containsUrl, stripUrls } from "@/lib/moderation";
import { BouquetSvg, type EditableBouquetItem } from "./BouquetSvg";
import { TurnstileWidget } from "@/components/ui/TurnstileWidget";

export interface SendStepPanelProps {
  bouquet: BouquetJson;
  editableItems: readonly EditableBouquetItem[];
  turnstileSiteKey: string;
  onBackToBuilder: () => void;
}

export function SendStepPanel({
  bouquet,
  editableItems,
  turnstileSiteKey,
  onBackToBuilder,
}: SendStepPanelProps): React.ReactElement {
  const router = useRouter();
  const previewSvgRef = React.useRef<SVGSVGElement | null>(null);

  const [recipientEmail, setRecipientEmail] = React.useState("");
  const [recipientName, setRecipientName] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [signoff, setSignoff] = React.useState("");
  const [turnstileToken, setTurnstileToken] = React.useState<string>("");
  const [turnstileResetCount, setTurnstileResetCount] = React.useState(0);

  const [submittingStage, setSubmittingStage] = React.useState<
    "idle" | "rendering" | "sending"
  >("idle");
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const hasDetectedLink = React.useMemo(
    () => containsUrl(message) || containsUrl(signoff) || containsUrl(recipientName),
    [message, signoff, recipientName]
  );

  const handleStripUrlsClick = () => {
    setMessage((prev) => stripUrls(prev));
    setSignoff((prev) => stripUrls(prev));
    setRecipientName((prev) => stripUrls(prev));
    setErrorMessage(null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);

    if (bouquet.items.length === 0) {
      setErrorMessage("Tambahkan minimal 1 bunga ke buketmu dulu ya.");
      return;
    }

    if (!recipientEmail.trim()) {
      setErrorMessage("Isi alamat email penerima dulu ya.");
      return;
    }

    if (!message.trim()) {
      setErrorMessage("Tulis pesan rahasiamu dulu ya.");
      return;
    }

    if (hasDetectedLink) {
      setErrorMessage(
        "Demi keamanan penerima, pesan tidak boleh berisi link/URL. Klik 'Hapus link otomatis' di bawah kotak pesan ya."
      );
      return;
    }

    if (!turnstileToken) {
      setErrorMessage("Tunggu atau selesaikan verifikasi anti-bot terlebih dahulu ya.");
      return;
    }

    if (!previewSvgRef.current) {
      setErrorMessage("Pratinjau buket belum siap. Coba sekali lagi ya.");
      return;
    }

    try {
      setSubmittingStage("rendering");
      const pngBlob = await exportSvgElementToPngBlob(previewSvgRef.current);

      const uploadResponse = await fetch("/api/upload-preview", {
        method: "POST",
        headers: {
          "Content-Type": "image/png",
        },
        body: pngBlob,
      });

      const uploadData = (await uploadResponse.json()) as {
        ok?: boolean;
        previewPath?: string;
        error?: string;
      };

      if (!uploadResponse.ok || !uploadData.ok || !uploadData.previewPath) {
        throw new Error(
          uploadData.error ?? "Gagal menyiapkan gambar pratinjau buket. Coba lagi ya."
        );
      }

      setSubmittingStage("sending");
      const sendResponse = await fetch("/api/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bouquet,
          recipientEmail: recipientEmail.trim(),
          recipientName: recipientName.trim() || null,
          message: message.trim(),
          signoff: signoff.trim() || null,
          turnstileToken,
          previewPath: uploadData.previewPath,
        }),
      });

      const sendData = (await sendResponse.json()) as {
        ok?: boolean;
        error?: string;
      };

      if (!sendResponse.ok || !sendData.ok) {
        throw new Error(
          sendData.error ?? "Maaf, pengiriman belum berhasil. Coba beberapa saat lagi ya."
        );
      }

      router.push("/terkirim");
    } catch (err) {
      const friendly =
        err instanceof Error
          ? err.message
          : "Terjadi kendala saat mengirim buket. Coba sebentar lagi ya.";
      setErrorMessage(friendly);
      setTurnstileToken("");
      setTurnstileResetCount((c) => c + 1);
      setSubmittingStage("idle");
    }
  };

  const isBusy = submittingStage !== "idle";

  return (
    <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 lg:grid-cols-12">
      {/* Left Column: Live Final Bouquet Preview + Kartu Pesan Preview */}
      <div className="flex flex-col gap-4 lg:col-span-5">
        <div className="rounded-3xl border border-paper-border bg-paper-card p-4 shadow-cozy sm:p-5">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-script text-2xl font-bold text-ink">Pratinjau Buketmu</h2>
            <button
              type="button"
              onClick={onBackToBuilder}
              disabled={isBusy}
              className="inline-flex items-center gap-1 rounded-full bg-paper-warm px-3 py-1 text-xs font-bold text-ink-soft transition-colors hover:bg-blush-100 hover:text-blush-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blush-500"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Ubah Buket</span>
            </button>
          </div>

          <div className="mx-auto max-w-[340px] rounded-2xl bg-gradient-to-b from-paper to-paper-warm p-2">
            <BouquetSvg
              svgRef={previewSvgRef}
              paper={bouquet.paper}
              ribbon={bouquet.ribbon}
              items={editableItems}
              interactive={false}
              className="h-auto w-full"
            />
          </div>

          {/* Live Note Card Preview */}
          <div className="mt-4 rounded-2xl border border-dashed border-blush-200 bg-blush-50/40 p-4">
            {recipientName.trim() && (
              <p className="mb-1 text-xs font-bold uppercase tracking-wider text-blush-600">
                Untuk: {recipientName.trim()}
              </p>
            )}
            <p className="whitespace-pre-line break-words font-script text-2xl leading-snug text-ink">
              {message.trim()
                ? message
                : "Tulis pesanmu di sebelah kanan, nanti tampilannya akan muncul di kartu ini..."}
            </p>
            {signoff.trim() && (
              <p className="mt-2 text-right font-script text-xl text-ink-soft">
                — {signoff.trim()}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Right Column: Anonymous Send Form */}
      <div className="lg:col-span-7">
        <form
          onSubmit={handleSubmit}
          noValidate
          className="rounded-3xl border border-paper-border bg-paper-card p-5 shadow-cozy sm:p-7"
        >
          <h2 className="font-script text-3xl font-bold text-ink">
            Tulis Pesan &amp; Kirim Diam-Diam 💌
          </h2>
          <p className="mt-1 text-sm text-ink-soft">
            Kami tidak pernah meminta nama, akun, atau emailmu. Penerima hanya akan
            melihat buket dan kartu pesanmu.
          </p>

          {errorMessage && (
            <div
              role="alert"
              className="mt-4 rounded-2xl border border-blush-300 bg-blush-50 px-4 py-3 text-sm font-medium text-blush-700"
            >
              {errorMessage}
            </div>
          )}

          <div className="mt-5 space-y-4">
            {/* Recipient Email */}
            <div>
              <label
                htmlFor="recipient-email"
                className="mb-1.5 block text-sm font-bold text-ink"
              >
                Email Penerima <span className="text-blush-600">*</span>
              </label>
              <input
                id="recipient-email"
                name="recipientEmail"
                type="email"
                required
                autoComplete="off"
                maxLength={254}
                disabled={isBusy}
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                placeholder="contoh: seseorang@email.com"
                className="w-full rounded-2xl border border-paper-border bg-paper px-4 py-3 text-sm text-ink placeholder:text-ink-muted/70 focus:border-blush-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blush-200"
              />
            </div>

            {/* Optional Recipient Name */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label htmlFor="recipient-name" className="text-sm font-bold text-ink">
                  Nama Panggilan Penerima{" "}
                  <span className="font-normal text-ink-muted">(opsional)</span>
                </label>
                <span className="text-xs text-ink-muted">{recipientName.length}/60</span>
              </div>
              <input
                id="recipient-name"
                name="recipientName"
                type="text"
                maxLength={60}
                disabled={isBusy}
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="contoh: Kak Rara"
                className="w-full rounded-2xl border border-paper-border bg-paper px-4 py-2.5 text-sm text-ink placeholder:text-ink-muted/70 focus:border-blush-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blush-200"
              />
            </div>

            {/* Secret Message */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label htmlFor="secret-message" className="text-sm font-bold text-ink">
                  Pesan Rahasia <span className="text-blush-600">*</span>
                </label>
                <span
                  aria-live="polite"
                  className={`text-xs font-semibold ${
                    message.length >= 480 ? "text-blush-600" : "text-ink-muted"
                  }`}
                >
                  {message.length}/500
                </span>
              </div>
              <textarea
                id="secret-message"
                name="message"
                rows={4}
                required
                maxLength={500}
                disabled={isBusy}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tulis sesuatu yang tulus... misalnya ucapan semangat, terima kasih, atau perasaan yang selama ini belum sempat tersampaikan."
                className="w-full rounded-2xl border border-paper-border bg-paper px-4 py-3 text-sm leading-relaxed text-ink placeholder:text-ink-muted/70 focus:border-blush-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blush-200"
              />
              <div className="mt-1 flex flex-wrap items-center justify-between gap-2 text-xs text-ink-muted">
                <span>Tanpa tautan/link demi mencegah spam &amp; phishing.</span>
                {hasDetectedLink && (
                  <button
                    type="button"
                    onClick={handleStripUrlsClick}
                    className="font-bold text-blush-600 underline hover:text-blush-700"
                  >
                    Hapus link otomatis
                  </button>
                )}
              </div>
            </div>

            {/* Optional Sign-off */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label htmlFor="signoff" className="text-sm font-bold text-ink">
                  Salam Penutup{" "}
                  <span className="font-normal text-ink-muted">(opsional)</span>
                </label>
                <span className="text-xs text-ink-muted">{signoff.length}/60</span>
              </div>
              <input
                id="signoff"
                name="signoff"
                type="text"
                maxLength={60}
                disabled={isBusy}
                value={signoff}
                onChange={(e) => setSignoff(e.target.value)}
                placeholder="contoh: dari seseorang yang diam-diam peduli"
                className="w-full rounded-2xl border border-paper-border bg-paper px-4 py-2.5 text-sm text-ink placeholder:text-ink-muted/70 focus:border-blush-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blush-200"
              />
            </div>

            {/* Privacy Assurance Callout */}
            <div className="flex items-start gap-2.5 rounded-2xl bg-sage-50 px-4 py-3 text-xs leading-relaxed text-ink-soft">
              <Lock
                className="mt-0.5 h-4 w-4 shrink-0 text-sage-600"
                aria-hidden="true"
              />
              <p>
                <strong>Privasi terjaga:</strong> Email penerima dipakai satu kali saat
                mengirim lewat server, lalu hanya disimpan sebagai hash acak satu arah
                agar penerima tetap punya kendali berhenti berlangganan kapan saja.
              </p>
            </div>

            {/* Cloudflare Turnstile */}
            <div className="pt-1">
              <span className="mb-1.5 block text-xs font-bold text-ink-soft">
                Verifikasi Keamanan
              </span>
              <TurnstileWidget
                siteKey={turnstileSiteKey}
                resetSignal={turnstileResetCount}
                onVerify={(token) => setTurnstileToken(token)}
                onExpire={() => setTurnstileToken("")}
              />
            </div>
          </div>

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={onBackToBuilder}
              disabled={isBusy}
              className="inline-flex items-center justify-center gap-1.5 rounded-full border border-paper-border bg-paper px-5 py-3 text-sm font-bold text-ink-soft transition-colors hover:bg-paper-warm hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-blush-500 disabled:opacity-50"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              <span>Kembali Edit Buket</span>
            </button>

            <button
              type="submit"
              data-testid="submit-bouquet-btn"
              disabled={isBusy}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-blush-500 px-7 py-3.5 text-sm font-bold text-white shadow-petal transition-all hover:bg-blush-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blush-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Send className="h-4 w-4" aria-hidden="true" />
              <span>
                {submittingStage === "rendering"
                  ? "Membungkus buketmu..."
                  : submittingStage === "sending"
                    ? "Mengirim kejutanmu..."
                    : "Kirim Buket Sekarang 🌸"}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
