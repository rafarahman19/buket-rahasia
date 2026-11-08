import * as React from "react";
import Link from "next/link";

export function SiteHeader(): React.ReactElement {
  return (
    <header className="sticky top-0 z-30 border-b border-paper-border/80 bg-paper/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link
          href="/"
          className="group inline-flex items-center gap-2 rounded-full px-2 py-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-blush-500"
        >
          <span
            aria-hidden="true"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-blush-100 text-lg transition-transform duration-300 group-hover:rotate-12 group-hover:scale-105"
          >
            🌸
          </span>
          <span className="font-script text-2xl font-bold tracking-wide text-ink sm:text-3xl">
            Buket Rahasia
          </span>
        </Link>

        <nav aria-label="Navigasi utama" className="flex items-center gap-2 sm:gap-4">
          <Link
            href="/privasi"
            className="hidden rounded-full px-3 py-1.5 text-sm font-medium text-ink-soft transition-colors hover:bg-paper-warm hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-blush-500 sm:inline-block"
          >
            Privasi
          </Link>
          <Link
            href="/rakit"
            className="inline-flex items-center gap-1.5 rounded-full bg-blush-500 px-4 py-2 text-sm font-semibold text-white shadow-petal transition-all hover:bg-blush-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blush-500 focus-visible:ring-offset-2"
          >
            <span>Rakit Buket</span>
            <span aria-hidden="true">✨</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
