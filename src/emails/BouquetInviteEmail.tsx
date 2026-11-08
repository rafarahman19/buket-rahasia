import * as React from "react";
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

export interface BouquetInviteEmailProps {
  recipientName?: string | null;
  previewImageUrl: string;
  revealUrl: string;
  reportUrl: string;
  blockUrl: string;
}

export const FIXED_EMAIL_SUBJECT = "Ada yang diam-diam ngirim bunga buat kamu 🌸";

/**
 * Responsive, table-based React Email template compatible with Gmail, Outlook,
 * and Apple Mail. Intentionally omits the secret message so it is only revealed
 * on `/b/[id]`. React escapes all text children automatically against XSS.
 */
export function BouquetInviteEmail({
  recipientName,
  previewImageUrl,
  revealUrl,
  reportUrl,
  blockUrl,
}: BouquetInviteEmailProps): React.ReactElement {
  const safeGreeting = recipientName?.trim()
    ? `Hai, ${recipientName.trim()}!`
    : "Hai, kamu!";

  return (
    <Html lang="id">
      <Head />
      <Preview>
        Seseorang merangkai buket bunga digital khusus buat kamu dan menitipkan sepucuk
        pesan rahasia.
      </Preview>
      <Body style={styles.body}>
        <Container style={styles.outerContainer}>
          {/* Header Wordmark */}
          <Section style={styles.headerSection}>
            <Text style={styles.brandBadge}>🌸 BUKET RAHASIA</Text>
          </Section>

          {/* Main Card */}
          <Section style={styles.card}>
            <Heading as="h1" style={styles.heading}>
              {safeGreeting}
            </Heading>

            <Text style={styles.paragraph}>
              Seseorang baru saja merangkai buket bunga digital khusus buat kamu secara
              anonim — lengkap dengan sepucuk catatan kecil yang menunggu untuk kamu baca.
            </Text>

            {/* Bouquet Preview Image Box (graceful even when images are blocked) */}
            <Section style={styles.imageFrame}>
              <Img
                src={previewImageUrl}
                alt="Pratinjau buket bunga digital pastel yang dirangkai khusus untukmu"
                width="280"
                height="317"
                style={styles.previewImg}
              />
              <Text style={styles.imageCaption}>
                Buket bunga digital &amp; kartu pesanmu masih terbungkus rapi ✨
              </Text>
            </Section>

            <Text style={styles.teaserNote}>
              Demi menjaga kejutan, isi pesannya belum ditampilkan di email ini. Klik
              tombol di bawah untuk membuka bungkusan buketnya:
            </Text>

            {/* Primary CTA Button */}
            <Section style={styles.ctaWrapper}>
              <Button href={revealUrl} style={styles.ctaButton}>
                Buka Buketnya 🌸
              </Button>
            </Section>

            <Text style={styles.fallbackLinkText}>
              Atau salin tautan ini ke browser kamu:{" "}
              <Link href={revealUrl} style={styles.inlineLink}>
                {revealUrl}
              </Link>
            </Text>
          </Section>

          {/* Footer: Report & Signed Unsubscribe / Block Links */}
          <Section style={styles.footer}>
            <Text style={styles.footerText}>
              Email ini dikirim satu kali melalui <strong>Buket Rahasia</strong> atas
              permintaan pengirim anonim. Alamat emailmu tidak disimpan dalam bentuk teks
              asli di sistem kami.
            </Text>
            <Hr style={styles.divider} />
            <Text style={styles.footerActions}>
              <Link href={reportUrl} style={styles.footerLink}>
                Bukan kamu yang diharapkan? Laporkan
              </Link>
              {"  •  "}
              <Link href={blockUrl} style={styles.footerLink}>
                Jangan terima buket lagi
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

/**
 * Generates the plain-text alternative body matching the HTML email (never includes
 * the secret message, includes reveal, report, and signed opt-out links).
 */
export function buildBouquetInvitePlainText({
  recipientName,
  revealUrl,
  reportUrl,
  blockUrl,
}: Omit<BouquetInviteEmailProps, "previewImageUrl">): string {
  const greeting = recipientName?.trim() ? `Hai, ${recipientName.trim()}!` : "Hai, kamu!";

  return [
    "BUKET RAHASIA 🌸",
    "----------------------------------------",
    "",
    greeting,
    "",
    "Seseorang baru saja merangkai buket bunga digital khusus buat kamu secara anonim, lengkap dengan sepucuk pesan rahasia.",
    "",
    "Demi menjaga kejutan, isi pesannya hanya bisa dibuka di halaman berikut:",
    `Buka Buketnya: ${revealUrl}`,
    "",
    "----------------------------------------",
    "Email ini dikirim melalui Buket Rahasia. Alamat emailmu tidak disimpan dalam bentuk teks asli.",
    `Bukan kamu yang diharapkan? Laporkan: ${reportUrl}`,
    `Jangan terima buket lagi: ${blockUrl}`,
  ].join("\n");
}

const styles: Record<string, React.CSSProperties> = {
  body: {
    backgroundColor: "#FBF4EC",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    margin: 0,
    padding: "28px 12px",
    color: "#3B2E2A",
  },
  outerContainer: {
    maxWidth: "540px",
    margin: "0 auto",
  },
  headerSection: {
    textAlign: "center",
    paddingBottom: "14px",
  },
  brandBadge: {
    display: "inline-block",
    margin: 0,
    padding: "6px 16px",
    backgroundColor: "#FFE8ED",
    color: "#A12D4E",
    borderRadius: "999px",
    fontSize: "13px",
    fontWeight: 700,
    letterSpacing: "0.08em",
  },
  card: {
    backgroundColor: "#FFFDF9",
    border: "1px solid #EFE2D5",
    borderRadius: "20px",
    padding: "32px 26px",
    textAlign: "center",
  },
  heading: {
    margin: "0 0 12px",
    fontSize: "24px",
    lineHeight: "32px",
    fontWeight: 700,
    color: "#3B2E2A",
  },
  paragraph: {
    margin: "0 0 22px",
    fontSize: "15px",
    lineHeight: "24px",
    color: "#665550",
  },
  imageFrame: {
    backgroundColor: "#FFF5F7",
    border: "1px dashed #F7AEC0",
    borderRadius: "16px",
    padding: "20px 16px 14px",
    margin: "0 0 22px",
    textAlign: "center",
  },
  previewImg: {
    display: "block",
    margin: "0 auto 10px",
    maxWidth: "280px",
    width: "100%",
    height: "auto",
    borderRadius: "12px",
    color: "#A12D4E",
    fontSize: "13px",
  },
  imageCaption: {
    margin: 0,
    fontSize: "13px",
    lineHeight: "19px",
    color: "#8C7A74",
  },
  teaserNote: {
    margin: "0 0 22px",
    fontSize: "14px",
    lineHeight: "22px",
    color: "#665550",
  },
  ctaWrapper: {
    textAlign: "center",
    margin: "0 0 20px",
  },
  ctaButton: {
    backgroundColor: "#DF5B7D",
    color: "#FFFFFF",
    fontSize: "16px",
    fontWeight: 700,
    textDecoration: "none",
    textAlign: "center",
    display: "inline-block",
    padding: "14px 30px",
    borderRadius: "999px",
  },
  fallbackLinkText: {
    margin: 0,
    fontSize: "12px",
    lineHeight: "18px",
    color: "#8C7A74",
    wordBreak: "break-all",
  },
  inlineLink: {
    color: "#C43E63",
    textDecoration: "underline",
  },
  footer: {
    padding: "20px 14px 0",
    textAlign: "center",
  },
  footerText: {
    margin: "0 0 12px",
    fontSize: "12px",
    lineHeight: "18px",
    color: "#8C7A74",
  },
  divider: {
    borderColor: "#EFE2D5",
    margin: "12px 0",
  },
  footerActions: {
    margin: 0,
    fontSize: "12px",
    lineHeight: "20px",
    color: "#665550",
  },
  footerLink: {
    color: "#A12D4E",
    textDecoration: "underline",
  },
};

export default BouquetInviteEmail;
