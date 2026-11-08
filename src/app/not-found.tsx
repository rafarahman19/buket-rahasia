import * as React from "react";
import Link from "next/link";

export default function NotFoundPage(): React.ReactElement {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-20 text-center">
      <div
        aria-hidden="true"
        className="flex h-16 w-16 items-center justify-center rounded-full bg-paper-warm text-3xl"
      >
        🍃
      </div>
      <h1 className="mt-5 font-script text-4xl font-bold text-ink">
        Halaman Tidak Ditemukan
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-ink-soft">
        Tautan yang kamu buka mungkin salah ketik, sudah dihapus, atau masa simpannya
        sudah berakhir.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/rakit"
          className="rounded-full bg-blush-500 px-6 py-2.5 text-sm font-bold text-white shadow-petal hover:bg-blush-600"
        >
          Rakit Buket Baru 🌸
        </Link>
        <Link
          href="/"
          className="rounded-full border border-paper-border bg-paper-card px-5 py-2.5 text-sm font-bold text-ink-soft hover:bg-paper-warm"
        >
          Kembali ke Beranda
        </Link>
      </div>
    </div>
  );
}
