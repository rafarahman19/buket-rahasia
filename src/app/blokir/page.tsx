import * as React from "react";
import type { Metadata } from "next";
import { BlockEmailClient } from "@/components/ui/BlockEmailClient";

export const metadata: Metadata = {
  title: "Jangan Kirim Lagi",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function BlockPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}): Promise<React.ReactElement> {
  const { token } = await searchParams;

  return (
    <div className="mx-auto max-w-lg px-4 py-16 sm:py-24">
      <BlockEmailClient token={token ?? null} />
    </div>
  );
}
