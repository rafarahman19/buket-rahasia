import * as React from "react";
import Link from "next/link";

export function SiteFooter(): React.ReactElement {
  return (
    <footer className="mt-auto border-t border-paper-border bg-paper-warm/70">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="flex flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
          <div>
            <p className="font-script text-2xl font-bold text-ink">🌸 Buket Rahasia</p>
            <p className="mt-1 max-w-md text-xs leading-relaxed text-ink-muted">
              Kirim bunga digital &amp; pesan hangat secara anonim. Dibuat untuk
              menyebarkan kebaikan kecil tanpa menyimpan alamat email mentah.
            </p>
          </div>

          <nav
            aria-label="Tautan kebijakan"
            className="flex flex-wrap items-center justify-center gap-4 text-xs font-semibold text-ink-soft"
          >
            <Link
              href="/rakit"
              className="underline-offset-4 hover:text-blush-600 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-blush-500"
            >
              Mulai Rakit
            </Link>
            <Link
              href="/privasi"
              className="underline-offset-4 hover:text-blush-600 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-blush-500"
            >
              Kebijakan Privasi
            </Link>
            <Link
              href="/ketentuan"
              className="underline-offset-4 hover:text-blush-600 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-blush-500"
            >
              Ketentuan Layanan
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
