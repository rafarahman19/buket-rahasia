import * as React from "react";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Ketentuan Layanan",
  description:
    "Aturan penggunaan Buket Rahasia untuk menjaga ruang kejutan digital tetap hangat, aman, dan bebas pelecehan.",
};

export default function TermsPage(): React.ReactElement {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <article className="rounded-[2rem] border border-paper-border bg-paper-card p-6 shadow-cozy sm:p-10">
        <h1 className="font-script text-4xl font-bold text-ink sm:text-5xl">
          Ketentuan Layanan 🌿
        </h1>
        <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-ink-muted">
          Pembaruan terakhir: November 2026
        </p>

        <div className="mt-6 space-y-6 text-sm leading-relaxed text-ink-soft">
          <section>
            <h2 className="text-lg font-extrabold text-ink">
              1. Tujuan Penggunaan yang Hangat
            </h2>
            <p className="mt-2">
              <strong>Buket Rahasia</strong> disediakan untuk berbagi apresiasi, ucapan
              semangat, rasa terima kasih, dan pesan kasih sayang yang tulus. Dengan
              menggunakan layanan ini, kamu setuju untuk memakainya secara bertanggung
              jawab dan menghormati kenyamanan penerima.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-extrabold text-ink">
              2. Larangan Keras Penyalahgunaan &amp; Pelecehan
            </h2>
            <p className="mt-2">
              Layanan ini <strong>dilarang keras</strong> digunakan untuk:
            </p>
            <ul className="mt-2 list-disc space-y-1.5 pl-5">
              <li>
                Pelecehan, perundungan (bullying), intimidasi, penguntitan (stalking),
                atau ancaman kekerasan dalam bentuk apa pun.
              </li>
              <li>
                Ujaran kebencian, kata-kata kasar, penghinaan, atau konten bermuatan
                eksplisit.
              </li>
              <li>
                Penipuan, phishing, promosi komersial tanpa izin (spam), atau penyisipan
                tautan/URL eksternal di dalam pesan.
              </li>
              <li>
                Menyamar sebagai orang lain dengan niat merugikan atau menyesatkan
                penerima.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-extrabold text-ink">
              3. Moderasi, Batas Pengiriman, &amp; Pemblokiran
            </h2>
            <p className="mt-2">
              Demi mencegah gangguan, sistem kami menerapkan filter konten otomatis,
              penolakan tautan/URL, serta pembatasan jumlah pengiriman per pengirim dan
              per penerima. Apabila kiriman dari suatu jaringan berulang kali dilaporkan
              oleh penerima, hash IP pengirim akan diblokir secara otomatis dari layanan.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-extrabold text-ink">4. Penafian Layanan</h2>
            <p className="mt-2">
              Layanan ini disediakan sebagaimana adanya (&ldquo;as is&rdquo;). Kami berhak
              menghapus buket yang dilaporkan melanggar ketentuan ini kapan saja tanpa
              pemberitahuan sebelumnya, serta otomatis menghapus seluruh buket setelah
              masa simpan 90 hari berakhir.
            </p>
          </section>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-paper-border pt-6">
          <Link
            href="/"
            className="inline-flex rounded-full bg-paper-warm px-5 py-2.5 text-xs font-bold text-ink hover:bg-blush-100 hover:text-blush-700"
          >
            ← Kembali ke Beranda
          </Link>
          <Link
            href="/privasi"
            className="inline-flex rounded-full border border-paper-border bg-paper px-5 py-2.5 text-xs font-bold text-ink-soft hover:bg-paper-warm"
          >
            Baca Kebijakan Privasi
          </Link>
        </div>
      </article>
    </div>
  );
}
