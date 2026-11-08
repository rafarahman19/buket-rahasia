"use client";

import * as React from "react";
import Link from "next/link";
import { ShieldCheck, ShieldOff } from "lucide-react";

export function BlockEmailClient({
  token,
}: {
  token: string | null;
}): React.ReactElement {
  const [status, setStatus] = React.useState<"idle" | "loading" | "done" | "error">(
    "idle"
  );
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const handleConfirmBlock = async () => {
    if (!token) return;
    setStatus("loading");
    setErrorMessage(null);

    try {
      const response = await fetch("/api/block", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      });

      const data = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !data.ok) {
        throw new Error(
          data.error ?? "Gagal memproses pemblokiran. Tautan mungkin sudah kedaluwarsa."
        );
      }

      setStatus("done");
    } catch (err) {
      setStatus("error");
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Terjadi kendala saat menyimpan pengaturanmu."
      );
    }
  };

  if (!token) {
    return (
      <div className="rounded-3xl border border-paper-border bg-paper-card p-8 text-center shadow-cozy">
        <h1 className="font-script text-4xl font-bold text-ink">Tautan Tidak Lengkap</h1>
        <p className="mt-2 text-sm text-ink-soft">
          Gunakan tautan <strong>&ldquo;Jangan terima buket lagi&rdquo;</strong> langsung
          dari bagian bawah email atau halaman buket yang kamu terima ya.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex rounded-full bg-blush-500 px-6 py-2.5 text-sm font-bold text-white hover:bg-blush-600"
        >
          Kembali ke Beranda
        </Link>
      </div>
    );
  }

  if (status === "done") {
    return (
      <div
        role="status"
        className="rounded-3xl border border-sage-200 bg-paper-card p-8 text-center shadow-cozy"
      >
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-sage-100 text-sage-600">
          <ShieldCheck className="h-8 w-8" aria-hidden="true" />
        </div>
        <h1 className="mt-5 font-script text-4xl font-bold text-ink">
          Emailmu Sudah Diblokir dari Kiriman Baru
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">
          Mulai sekarang, tidak ada lagi buket atau email dari Buket Rahasia yang akan
          dikirim ke alamat emailmu. Kami hanya menyimpan kode hash acak satu arah tanpa
          menyimpan teks email aslimu.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex rounded-full border border-paper-border bg-paper px-6 py-2.5 text-sm font-bold text-ink-soft hover:bg-paper-warm"
        >
          Kembali ke Beranda
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-paper-border bg-paper-card p-8 text-center shadow-cozy">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blush-100 text-blush-700">
        <ShieldOff className="h-8 w-8" aria-hidden="true" />
      </div>
      <h1 className="mt-5 font-script text-4xl font-bold text-ink">
        Berhenti Menerima Buket Rahasia?
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-ink-soft">
        Jika kamu menekan tombol di bawah, alamat emailmu tidak akan menerima kiriman
        buket bunga digital apa pun lagi di masa mendatang.
      </p>

      {errorMessage && (
        <div
          role="alert"
          className="mt-4 rounded-2xl border border-blush-300 bg-blush-50 px-4 py-3 text-xs font-semibold text-blush-700"
        >
          {errorMessage}
        </div>
      )}

      <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <button
          type="button"
          data-testid="confirm-block-btn"
          disabled={status === "loading"}
          onClick={handleConfirmBlock}
          className="inline-flex w-full items-center justify-center rounded-full bg-blush-600 px-6 py-3 text-sm font-bold text-white shadow-petal hover:bg-blush-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blush-500 disabled:opacity-50 sm:w-auto"
        >
          {status === "loading" ? "Memproses..." : "Ya, Jangan Kirim Lagi ke Email Ini"}
        </button>
        <Link
          href="/"
          className="inline-flex w-full items-center justify-center rounded-full border border-paper-border bg-paper px-5 py-3 text-sm font-bold text-ink-soft hover:bg-paper-warm sm:w-auto"
        >
          Batal
        </Link>
      </div>
    </div>
  );
}
