import * as React from "react";
import type { Metadata, Viewport } from "next";
import { Caveat, Nunito } from "next/font/google";
import "./globals.css";
import { SiteFooter } from "@/components/ui/SiteFooter";
import { SiteHeader } from "@/components/ui/SiteHeader";

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-nunito",
  display: "swap",
});

const caveat = Caveat({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-caveat",
  display: "swap",
});

const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#FFFBF7",
};

export const metadata: Metadata = {
  metadataBase: new URL(appBaseUrl),
  title: {
    default: "Buket Rahasia 🌸 — Kirim Buket Bunga Digital & Pesan Anonim",
    template: "%s | Buket Rahasia",
  },
  description:
    "Rangkai buket bunga digital bergaya pastel yang manis, tulis sepucuk pesan hangat, dan kirim ke email seseorang secara anonim.",
  openGraph: {
    type: "website",
    locale: "id_ID",
    siteName: "Buket Rahasia",
    title: "Buket Rahasia 🌸 — Kirim Buket Bunga Digital & Pesan Anonim",
    description:
      "Rangkai buket bunga digital pastel dan kirim pesan rahasia penuh kehangatan lewat email tanpa mengungkap identitasmu.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Buket Rahasia 🌸 — Kirim Buket Bunga Digital & Pesan Anonim",
    description:
      "Rangkai buket bunga digital pastel dan kirim pesan rahasia penuh kehangatan lewat email.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): React.ReactElement {
  return (
    <html lang="id" className={`${nunito.variable} ${caveat.variable}`}>
      <body className="flex min-h-dvh flex-col font-sans text-ink antialiased">
        <a
          href="#konten-utama"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-blush-600 focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-white"
        >
          Langsung ke konten utama
        </a>
        <SiteHeader />
        <main id="konten-utama" className="flex-1">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
