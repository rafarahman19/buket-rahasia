"use client";

import * as React from "react";
import Link from "next/link";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): React.ReactElement {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-20 text-center">
      <div
        aria-hidden="true"
        className="flex h-16 w-16 items-center justify-center rounded-full bg-blush-100 text-3xl"
      >
        🥀
      </div>
      <h1 className="mt-5 font-script text-4xl font-bold text-ink">
        Ups, ada kelopak yang terselip...
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-ink-soft">
        Maaf ya, terjadi kendala kecil saat memuat halaman ini. Kamu bisa mencoba memuat
        ulang atau kembali ke beranda.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-full bg-blush-500 px-6 py-2.5 text-sm font-bold text-white shadow-petal hover:bg-blush-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blush-500"
        >
          Coba Muat Ulang
        </button>
        <Link
          href="/"
          className="rounded-full border border-paper-border bg-paper-card px-5 py-2.5 text-sm font-bold text-ink-soft hover:bg-paper-warm"
        >
          Ke Beranda
        </Link>
      </div>
    </div>
  );
}
