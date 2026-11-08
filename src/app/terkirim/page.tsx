import * as React from "react";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Buketmu Sudah Terkirim",
  robots: {
    index: false,
    follow: false,
  },
};

export default function ConfirmationPage(): React.ReactElement {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-16 text-center sm:py-24">
      <div className="w-full rounded-[2rem] border border-paper-border bg-paper-card p-8 shadow-cozy sm:p-10">
        <div
          aria-hidden="true"
          className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-blush-100 text-4xl shadow-inner"
        >
          🌸
        </div>

        <h1
          data-testid="confirmation-heading"
          className="mt-6 font-script text-4xl font-bold text-ink sm:text-5xl"
        >
          Buketmu sudah terkirim 🌸
        </h1>

        <p className="mt-3 text-sm leading-relaxed text-ink-soft sm:text-base">
          Kejutan kecilmu sedang meluncur ke kotak masuk penerima. Demi menjaga
          kerahasiaan dan privasi penerima, kami tidak menampilkan tautan buket atau
          alamat tujuan di halaman ini.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/rakit"
            className="inline-flex w-full items-center justify-center rounded-full bg-blush-500 px-7 py-3.5 text-sm font-bold text-white shadow-petal transition-all hover:bg-blush-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blush-500 sm:w-auto"
          >
            Rakit Buket Lagi ✨
          </Link>
          <Link
            href="/"
            className="inline-flex w-full items-center justify-center rounded-full border border-paper-border bg-paper px-6 py-3.5 text-sm font-bold text-ink-soft transition-colors hover:bg-paper-warm hover:text-ink sm:w-auto"
          >
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    </div>
  );
}
