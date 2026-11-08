"use client";

import * as React from "react";
import dynamic from "next/dynamic";

const DynamicBouquetBuilder = dynamic(() => import("./BouquetBuilderClient"), {
  ssr: false,
  loading: () => (
    <div className="mx-auto max-w-4xl px-4 py-16 text-center">
      <div className="mx-auto inline-flex h-14 w-14 animate-pulse items-center justify-center rounded-full bg-blush-100 text-2xl">
        🌸
      </div>
      <p className="mt-4 font-script text-3xl font-bold text-ink">
        Menyiapkan meja perangkai bunga...
      </p>
      <p className="mt-1 text-sm text-ink-soft">
        Tunggu sebentar ya, kelopak-kelopaknya sedang disusun.
      </p>
    </div>
  ),
});

export function BouquetBuilderLazy({
  turnstileSiteKey,
}: {
  turnstileSiteKey: string;
}): React.ReactElement {
  return <DynamicBouquetBuilder turnstileSiteKey={turnstileSiteKey} />;
}
