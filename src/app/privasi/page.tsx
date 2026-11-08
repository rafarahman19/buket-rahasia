import * as React from "react";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Kebijakan Privasi",
  description:
    "Penjelasan transparan mengenai data yang disimpan, hashing satu arah, dan penghapusan otomatis 90 hari di Buket Rahasia.",
};

export default function PrivacyPage(): React.ReactElement {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <article className="rounded-[2rem] border border-paper-border bg-paper-card p-6 shadow-cozy sm:p-10">
        <h1 className="font-script text-4xl font-bold text-ink sm:text-5xl">
          Kebijakan Privasi 🌸
        </h1>
        <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-ink-muted">
          Pembaruan terakhir: November 2026
        </p>

        <div className="mt-6 space-y-6 text-sm leading-relaxed text-ink-soft">
          <section>
            <h2 className="text-lg font-extrabold text-ink">
              1. Prinsip Utama: Minim Data, Maksimal Privasi
            </h2>
            <p className="mt-2">
              <strong>Buket Rahasia</strong> dibuat agar kamu bisa mengirim kejutan bunga
              digital secara anonim tanpa mengorbankan privasi penerima. Kami{" "}
              <strong>tidak pernah meminta</strong> nama asli, akun, nomor telepon, atau
              alamat email pengirim.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-extrabold text-ink">
              2. Data Apa Saja yang Kami Simpan?
            </h2>
            <ul className="mt-2 list-disc space-y-2 pl-5">
              <li>
                <strong>Susunan Buket &amp; Isi Pesan:</strong> Konfigurasi posisi bunga
                (JSON), gambar pratinjau buket (PNG), nama panggilan opsional, isi pesan
                (maksimal 500 karakter), serta salam penutup opsional.
              </li>
              <li>
                <strong>Hash Email Penerima (SHA-256 + Pepper Rahasia):</strong> Alamat
                email asli penerima <em>hanya</em> digunakan satu kali di memori server
                untuk diteruskan ke penyedia pengiriman email (Resend) dan{" "}
                <strong>tidak pernah disimpan dalam bentuk teks asli</strong> di basis
                data kami. Kami hanya menyimpan kode hash kriptografis satu arah untuk
                membatasi frekuensi pengiriman (rate limit) dan menjalankan daftar blokir
                (berhenti berlangganan).
              </li>
              <li>
                <strong>Hash Alamat IP Pengirim (SHA-256 + Pepper Rahasia):</strong>{" "}
                Alamat IP mentah tidak disimpan. Kami hanya menyimpan hash satu arahnya
                semata-mata untuk mencegah spam dan menindak penyalahgunaan berulang tanpa
                membongkar identitas pengirim yang sopan.
              </li>
              <li>
                <strong>Waktu Pembuatan &amp; Waktu Dibuka Pertama Kali:</strong>{" "}
                Digunakan untuk masa retensi otomatis.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-extrabold text-ink">
              3. Masa Simpan &amp; Penghapusan Otomatis (90 Hari)
            </h2>
            <p className="mt-2">
              Seluruh data buket, isi pesan, dan file gambar pratinjau PNG akan{" "}
              <strong>dihapus secara otomatis setelah 90 hari</strong> sejak tanggal
              pengiriman melalui jadwal pembersihan harian otomatis (Vercel Cron Job).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-extrabold text-ink">
              4. Hak Penerima untuk Berhenti Menerima &amp; Melapor
            </h2>
            <p className="mt-2">
              Setiap email dan halaman buket dilengkapi tautan bertanda tangan
              kriptografis <strong>&ldquo;Jangan terima buket lagi&rdquo;</strong> /{" "}
              <strong>&ldquo;Jangan kirim lagi ke email ini&rdquo;</strong>. Begitu
              diaktifkan, hash email penerima masuk ke daftar blokir permanen sehingga
              tidak ada lagi kiriman yang bisa masuk ke alamat tersebut. Penerima juga
              dapat menekan tombol <strong>&ldquo;Laporkan&rdquo;</strong> apabila isi
              pesan dirasa mengganggu.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-extrabold text-ink">
              5. Layanan Pihak Ketiga Terbatas
            </h2>
            <p className="mt-2">
              Kami menggunakan Cloudflare Turnstile untuk perlindungan anti-bot tanpa
              pelacakan iklan, Upstash Redis untuk pembatasan laju (hanya menggunakan
              kunci hash), Supabase untuk penyimpanan terenkripsi sisi server, dan Resend
              untuk pengantaran email transaksional.
            </p>
          </section>
        </div>

        <div className="mt-8 border-t border-paper-border pt-6">
          <Link
            href="/"
            className="inline-flex rounded-full bg-paper-warm px-5 py-2.5 text-xs font-bold text-ink hover:bg-blush-100 hover:text-blush-700"
          >
            ← Kembali ke Beranda
          </Link>
        </div>
      </article>
    </div>
  );
}
