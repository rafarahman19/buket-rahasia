import * as React from "react";
import type { Metadata } from "next";
import { BouquetBuilderLazy } from "@/components/bouquet/BouquetBuilderLazy";

export const metadata: Metadata = {
  title: "Rakit Buket Bunga",
  description:
    "Pilih mawar, tulip, peony, daun eukaliptus, kertas pembungkus, dan pita untuk merangkai buket bunga digital rahasiamu.",
};

export default function BuilderPage(): React.ReactElement {
  const turnstileSiteKey =
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "1x00000000000000000000AA";

  return <BouquetBuilderLazy turnstileSiteKey={turnstileSiteKey} />;
}
