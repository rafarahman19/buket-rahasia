import * as React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RevealExperience } from "@/components/bouquet/RevealExperience";
import { signBlockTokenWithSecret } from "@/lib/crypto";
import { getServerEnv } from "@/lib/env";
import { getBouquetForRevealAndMarkOpened } from "@/lib/repository";
import { bouquetSchema, isValidBouquetId } from "@/lib/validation";

export const dynamic = "force-dynamic";

// Static generic metadata that NEVER leaks the bouquet message, signoff, or recipient
export const metadata: Metadata = {
  title: "Ada Kiriman Buket Rahasia Untukmu 🌸",
  description:
    "Seseorang merangkai buket bunga digital khusus buat kamu. Buka halaman ini untuk melihat kejutan dan pesannya.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
      "max-snippet": 0,
    },
  },
  openGraph: {
    title: "Ada Kiriman Buket Rahasia Untukmu 🌸",
    description:
      "Seseorang merangkai buket bunga digital khusus buat kamu secara anonim.",
  },
};

export default async function BouquetRevealPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ lapor?: string }>;
}): Promise<React.ReactElement> {
  const { id } = await params;
  const resolvedSearch = await searchParams;

  // Return identical 404 for malformed, unknown, and removed IDs
  if (!isValidBouquetId(id)) {
    notFound();
  }

  const record = await getBouquetForRevealAndMarkOpened(id);
  if (!record) {
    notFound();
  }

  const parsedBouquet = bouquetSchema.safeParse(record.bouquet_json);
  if (!parsedBouquet.success) {
    notFound();
  }

  const env = getServerEnv();
  const blockToken = signBlockTokenWithSecret(
    record.recipient_email_hash,
    env.HMAC_SECRET
  );

  return (
    <RevealExperience
      bouquetId={record.id}
      bouquet={parsedBouquet.data}
      message={record.message}
      signoff={record.signoff}
      recipientName={record.recipient_name}
      blockToken={blockToken}
      initialOpenReport={resolvedSearch.lapor === "1"}
    />
  );
}
