"use client";

import * as React from "react";
import Link from "next/link";
import { Flag, RotateCw, ShieldOff, Sparkles } from "lucide-react";
import type { BouquetJson } from "@/lib/bouquet-catalog";
import { BouquetSvg, type EditableBouquetItem } from "./BouquetSvg";

export interface RevealExperienceProps {
  bouquetId: string;
  bouquet: BouquetJson;
  message: string;
  signoff: string | null;
  recipientName: string | null;
  blockToken: string;
  initialOpenReport?: boolean;
}

export function RevealExperience({
  bouquetId,
  bouquet,
  message,
  signoff,
  recipientName,
  blockToken,
  initialOpenReport = false,
}: RevealExperienceProps): React.ReactElement {
  const [reducedMotion, setReducedMotion] = React.useState(false);
  const [stage, setStage] = React.useState<"closed" | "opening" | "bloomed">("closed");
  const [replayKey, setReplayKey] = React.useState(0);

  const [reportOpen, setReportOpen] = React.useState(initialOpenReport);
  const [reportReason, setReportReason] = React.useState("");
  const [reportStatus, setReportStatus] = React.useState<
    "idle" | "submitting" | "done" | "error"
  >("idle");
  const [reportError, setReportError] = React.useState<string | null>(null);

  const displayItems = React.useMemo<EditableBouquetItem[]>(
    () =>
      bouquet.items.map((item, idx) => ({
        uid: `rev_${idx}`,
        ...item,
      })),
    [bouquet.items]
  );

  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const prefersReduced = mq.matches;
    setReducedMotion(prefersReduced);

    if (prefersReduced) {
      setStage("bloomed");
      return;
    }

    setStage("closed");
    const openTimer = setTimeout(() => {
      setStage("opening");
    }, 120);

    const bloomDuration = 900 + Math.min(bouquet.items.length, 25) * 55;
    const bloomTimer = setTimeout(() => {
      setStage("bloomed");
    }, bloomDuration);

    return () => {
      clearTimeout(openTimer);
      clearTimeout(bloomTimer);
    };
  }, [bouquet.items.length, replayKey]);

  const handleSubmitReport = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setReportStatus("submitting");
    setReportError(null);

    try {
      const response = await fetch("/api/report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bouquetId,
          reason: reportReason.trim() || null,
        }),
      });

      const data = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !data.ok) {
        throw new Error(data.error ?? "Gagal mengirim laporan. Coba lagi sebentar ya.");
      }

      setReportStatus("done");
    } catch (err) {
      setReportStatus("error");
      setReportError(
        err instanceof Error
          ? err.message
          : "Terjadi kendala saat mengirim laporan. Coba lagi ya."
      );
    }
  };

  const blockHref = `/blokir?token=${encodeURIComponent(blockToken)}`;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
      {/* Top Badge */}
      <div className="mb-4 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-blush-100 px-3.5 py-1 text-xs font-bold text-blush-700">
          <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Kiriman Buket Rahasia Untukmu</span>
        </span>
      </div>

      {reportStatus === "done" ? (
        <div
          role="status"
          className="rounded-3xl border border-paper-border bg-paper-card p-6 text-center shadow-cozy sm:p-8"
        >
          <p className="font-script text-3xl font-bold text-ink">
            Terima kasih sudah melapor 🙏
          </p>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">
            Laporanmu sudah kami catat dan isi pesan ini telah kami sembunyikan dari
            layarmu. Jika kamu tidak ingin menerima buket anonim lagi ke alamat emailmu,
            kamu juga bisa mengaktifkan pemblokiran di bawah ini.
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href={blockHref}
              className="inline-flex items-center gap-2 rounded-full bg-blush-500 px-6 py-3 text-sm font-bold text-white shadow-petal hover:bg-blush-600"
            >
              <ShieldOff className="h-4 w-4" aria-hidden="true" />
              <span>Jangan Kirim Lagi ke Email Ini</span>
            </Link>
            <Link
              href="/"
              className="inline-flex items-center rounded-full border border-paper-border bg-paper px-5 py-3 text-sm font-bold text-ink-soft hover:bg-paper-warm"
            >
              Kembali ke Beranda
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* Animated Bouquet Stage */}
          <div className="relative mx-auto max-w-[440px] rounded-3xl border border-paper-border bg-gradient-to-b from-paper-card via-paper to-paper-warm p-3 shadow-cozy sm:p-5">
            <BouquetSvg
              key={replayKey}
              paper={bouquet.paper}
              ribbon={bouquet.ribbon}
              items={displayItems}
              revealStage={stage}
              reducedMotion={reducedMotion}
              className="h-auto w-full"
            />

            {!reducedMotion && (
              <div className="mt-2 flex justify-center">
                <button
                  type="button"
                  onClick={() => setReplayKey((k) => k + 1)}
                  className="inline-flex items-center gap-1.5 rounded-full bg-white/85 px-3 py-1 text-xs font-semibold text-ink-soft shadow-sm transition-colors hover:bg-blush-50 hover:text-blush-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blush-500"
                >
                  <RotateCw className="h-3 w-3" aria-hidden="true" />
                  <span>Putar ulang mekarnya</span>
                </button>
              </div>
            )}
          </div>

          {/* Secret Message Card (Plain text only — zero dangerouslySetInnerHTML) */}
          <section
            aria-label="Kartu pesan rahasia"
            data-testid="reveal-message-card"
            className="mt-6 rounded-3xl border border-blush-200 bg-paper-card p-6 shadow-cozy transition-all duration-700 sm:p-8"
            style={
              reducedMotion
                ? { opacity: 1 }
                : {
                    opacity: stage === "bloomed" ? 1 : 0,
                    transform:
                      stage === "bloomed" ? "translateY(0px)" : "translateY(18px)",
                  }
            }
          >
            {recipientName && (
              <p className="mb-2 text-xs font-bold uppercase tracking-widest text-blush-600">
                Untuk: {recipientName}
              </p>
            )}

            <p
              data-testid="reveal-secret-message"
              className="whitespace-pre-line break-words font-script text-2xl leading-relaxed text-ink sm:text-3xl"
            >
              {message}
            </p>

            {signoff && (
              <p
                data-testid="reveal-signoff"
                className="mt-4 text-right font-script text-xl text-ink-soft sm:text-2xl"
              >
                — {signoff}
              </p>
            )}
          </section>

          {/* Primary CTA: Send a bouquet to someone else */}
          <div className="mt-8 text-center">
            <Link
              href="/rakit"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-blush-500 px-7 py-3.5 text-sm font-bold text-white shadow-petal transition-all hover:-translate-y-0.5 hover:bg-blush-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blush-500 focus-visible:ring-offset-2 sm:text-base"
            >
              <span>Buat buket untuk orang lain 🌸</span>
            </Link>
          </div>

          {/* Safety Links: Laporkan & Jangan kirim lagi ke email ini */}
          <div className="mt-8 border-t border-paper-border pt-5 text-center">
            <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-semibold text-ink-muted">
              <button
                type="button"
                data-testid="open-report-btn"
                onClick={() => setReportOpen((v) => !v)}
                className="inline-flex items-center gap-1 underline-offset-4 hover:text-blush-700 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-blush-500"
              >
                <Flag className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Laporkan</span>
              </button>
              <span aria-hidden="true">•</span>
              <Link
                href={blockHref}
                data-testid="block-email-link"
                className="inline-flex items-center gap-1 underline-offset-4 hover:text-blush-700 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-blush-500"
              >
                <ShieldOff className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Jangan kirim lagi ke email ini</span>
              </Link>
            </div>

            {reportOpen && (
              <form
                onSubmit={handleSubmitReport}
                className="mx-auto mt-4 max-w-md rounded-2xl border border-paper-border bg-paper-card p-4 text-left shadow-sm"
              >
                <label
                  htmlFor="report-reason"
                  className="block text-xs font-bold text-ink"
                >
                  Laporkan pesan yang mengganggu atau tidak pantas
                </label>
                <p className="mt-0.5 text-[11px] text-ink-muted">
                  Pengirim yang disalahgunakan untuk mengganggu orang lain akan dibatasi
                  atau diblokir secara otomatis.
                </p>
                <textarea
                  id="report-reason"
                  rows={2}
                  maxLength={500}
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  placeholder="Alasan singkat (opsional, misal: spam atau pesan mengganggu)"
                  className="mt-2 w-full rounded-xl border border-paper-border bg-paper px-3 py-2 text-xs text-ink focus:border-blush-400 focus:outline-none focus:ring-2 focus:ring-blush-200"
                />
                {reportError && (
                  <p role="alert" className="mt-1.5 text-xs text-blush-700">
                    {reportError}
                  </p>
                )}
                <div className="mt-3 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setReportOpen(false)}
                    className="rounded-full px-3 py-1.5 text-xs font-semibold text-ink-soft hover:bg-paper-warm"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={reportStatus === "submitting"}
                    className="rounded-full bg-blush-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-blush-700 disabled:opacity-50"
                  >
                    {reportStatus === "submitting" ? "Mengirim..." : "Kirim Laporan"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </>
      )}
    </div>
  );
}
