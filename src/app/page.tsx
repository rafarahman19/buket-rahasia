import * as React from "react";
import Link from "next/link";
import { Heart, Lock, Mail, Sparkles } from "lucide-react";
import {
  BouquetElementGraphic,
  BouquetRibbonBow,
  WrappingPaperBack,
  WrappingPaperDefs,
  WrappingPaperFront,
} from "@/components/bouquet/BouquetArt";
import { FloatingPetals } from "@/components/landing/FloatingPetals";
import { createStarterBouquet } from "@/lib/bouquet-catalog";

export default function LandingPage(): React.ReactElement {
  const heroBouquet = createStarterBouquet();

  return (
    <div className="relative overflow-hidden">
      <FloatingPetals />

      {/* Hero Section */}
      <section className="relative mx-auto max-w-6xl px-4 pb-12 pt-10 sm:px-6 sm:pb-16 sm:pt-14">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12">
          <div className="text-center lg:col-span-7 lg:text-left">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-blush-200 bg-blush-50 px-3.5 py-1 text-xs font-bold text-blush-700">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Menfess Bunga Digital • 100% Tanpa Akun</span>
            </span>

            <h1 className="mt-4 font-script text-5xl font-bold leading-tight text-ink sm:text-6xl">
              Ada rasa yang belum sempat terucap? Sampaikan lewat{" "}
              <span className="text-blush-600">seikat bunga.</span>
            </h1>

            <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-ink-soft sm:text-lg lg:mx-0">
              Rangkai sendiri mawar, tulip, peony, hingga lavender bergaya ilustrasi
              pastel yang lembut. Titipkan sepucuk pesan hangat, lalu kirim diam-diam ke
              email seseorang sebagai pengagum rahasia.
            </p>

            <div className="mt-7 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
              <Link
                href="/rakit"
                data-testid="hero-start-btn"
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-blush-500 px-8 py-4 text-base font-bold text-white shadow-petal transition-all hover:-translate-y-0.5 hover:bg-blush-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blush-500 focus-visible:ring-offset-2 sm:w-auto"
              >
                <span>Mulai Rakit Buket</span>
                <span aria-hidden="true">🌸</span>
              </Link>
              <a
                href="#cara-anonim"
                className="inline-flex w-full items-center justify-center rounded-full border border-paper-border bg-paper-card px-6 py-4 text-sm font-bold text-ink-soft transition-colors hover:bg-paper-warm hover:text-ink sm:w-auto"
              >
                Gimana anonimitasnya?
              </a>
            </div>
          </div>

          {/* Original Server-Rendered Hero Bouquet Card */}
          <div className="lg:col-span-5">
            <div className="mx-auto max-w-[380px] rounded-[2rem] border border-paper-border bg-paper-card p-5 shadow-cozy">
              <div className="rounded-3xl bg-gradient-to-b from-paper to-paper-warm p-2">
                <svg
                  viewBox="0 0 600 680"
                  role="img"
                  aria-label="Contoh ilustrasi buket bunga digital pastel dengan pita merah muda"
                  className="h-auto w-full"
                >
                  <WrappingPaperDefs paper={heroBouquet.paper} idPrefix="hero" />
                  <circle cx="300" cy="310" r="230" fill="#FCEEF2" fillOpacity="0.6" />
                  <WrappingPaperBack paper={heroBouquet.paper} idPrefix="hero" />
                  {heroBouquet.items.map((item, idx) => (
                    <g
                      key={idx}
                      transform={`translate(${item.x}, ${item.y}) rotate(${item.rotation}) scale(${item.scale})`}
                    >
                      <BouquetElementGraphic type={item.type} />
                    </g>
                  ))}
                  <WrappingPaperFront paper={heroBouquet.paper} idPrefix="hero" />
                  <BouquetRibbonBow ribbon={heroBouquet.ribbon} />
                </svg>
              </div>
              <div className="mt-3 rounded-2xl border border-dashed border-blush-200 bg-blush-50/50 px-4 py-3 text-center">
                <p className="font-script text-2xl text-ink">
                  &ldquo;Terima kasih sudah jadi alasan aku tersenyum minggu ini.&rdquo;
                </p>
                <p className="mt-0.5 font-script text-lg text-ink-soft">
                  — dari seseorang yang diam-diam peduli
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works & Anonymity Note */}
      <section
        id="cara-anonim"
        className="mx-auto max-w-6xl px-4 pb-16 pt-4 sm:px-6 sm:pb-20"
      >
        <div className="rounded-[2rem] border border-paper-border bg-paper-card p-6 shadow-card sm:p-10">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-script text-4xl font-bold text-ink">
              Cara Kerja &amp; Catatan Anonimitas 🔒
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">
              Dirancang supaya kejutanmu terasa manis dan tetap aman bagi pengirim maupun
              penerima.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-3">
            <div className="rounded-2xl border border-paper-border/80 bg-paper p-5">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-blush-100 text-blush-700">
                <Heart className="h-5 w-5" aria-hidden="true" />
              </div>
              <h3 className="mt-3 text-base font-extrabold text-ink">
                1. Identitasmu Tidak Pernah Diminta
              </h3>
              <p className="mt-1.5 text-xs leading-relaxed text-ink-soft">
                Tanpa login, tanpa nama asli, dan tanpa alamat email pengirim. Kamu cukup
                merakit bunga dan menulis salam penutup sesukamu.
              </p>
            </div>

            <div className="rounded-2xl border border-paper-border/80 bg-paper p-5">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-sage-100 text-sage-600">
                <Mail className="h-5 w-5" aria-hidden="true" />
              </div>
              <h3 className="mt-3 text-base font-extrabold text-ink">
                2. Email Penerima Tidak Disimpan Mentah
              </h3>
              <p className="mt-1.5 text-xs leading-relaxed text-ink-soft">
                Alamat email penerima hanya diteruskan satu kali untuk mengirim undangan
                buket, lalu diubah menjadi kode acak satu arah (hash SHA-256).
              </p>
            </div>

            <div className="rounded-2xl border border-paper-border/80 bg-paper p-5">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-lavender-100 text-lavender-500">
                <Lock className="h-5 w-5" aria-hidden="true" />
              </div>
              <h3 className="mt-3 text-base font-extrabold text-ink">
                3. Kendali Penuh di Tangan Penerima
              </h3>
              <p className="mt-1.5 text-xs leading-relaxed text-ink-soft">
                Isi pesan rahasia hanya terbuka lewat tautan acak yang tak bisa ditebak,
                otomatis terhapus dalam 90 hari, dan penerima bisa berhenti menerima kapan
                saja.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
