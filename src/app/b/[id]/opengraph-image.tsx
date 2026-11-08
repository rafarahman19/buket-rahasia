import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Ada kiriman Buket Rahasia untukmu";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

/**
 * Generic OpenGraph image for `/b/[id]`.
 * Intentionally performs ZERO database reads so link previews in chat apps
 * can never leak the recipient's secret message or bouquet contents.
 */
export default function RevealOpenGraphImage(): ImageResponse {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#FFFBF7",
        backgroundImage:
          "radial-gradient(circle at 20% 20%, #FFE8ED 0%, transparent 50%), radial-gradient(circle at 80% 80%, #ECE6F8 0%, transparent 50%)",
        padding: "56px",
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#FFFDF9",
          border: "3px dashed #F7AEC0",
          borderRadius: "40px",
          padding: "56px 72px",
          textAlign: "center",
          maxWidth: "940px",
        }}
      >
        <div
          style={{
            padding: "8px 24px",
            borderRadius: "999px",
            backgroundColor: "#FFE8ED",
            color: "#A12D4E",
            fontSize: 22,
            fontWeight: 700,
            marginBottom: 24,
          }}
        >
          KIRIMAN ANONIM • BUKET RAHASIA
        </div>
        <div
          style={{
            fontSize: 58,
            fontWeight: 800,
            color: "#3B2E2A",
            lineHeight: 1.18,
            marginBottom: 18,
          }}
        >
          Ada Seikat Bunga Digital Menunggu Untuk Dibuka
        </div>
        <div
          style={{
            fontSize: 26,
            color: "#665550",
            lineHeight: 1.4,
          }}
        >
          Buka tautan ini untuk melihat buket dan membaca pesan rahasianya.
        </div>
      </div>
    </div>,
    {
      ...size,
    }
  );
}
