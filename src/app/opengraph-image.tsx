import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Buket Rahasia — Kirim Buket Bunga Digital & Pesan Anonim";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OpenGraphImage(): ImageResponse {
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
          "radial-gradient(circle at 25% 25%, #FFE8ED 0%, transparent 45%), radial-gradient(circle at 80% 75%, #E5EFE6 0%, transparent 45%)",
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
          border: "3px solid #F7AEC0",
          borderRadius: "40px",
          padding: "56px 72px",
          textAlign: "center",
          maxWidth: "980px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "10px 26px",
            borderRadius: "999px",
            backgroundColor: "#FFE8ED",
            color: "#A12D4E",
            fontSize: 24,
            fontWeight: 700,
            marginBottom: 24,
          }}
        >
          BUKET RAHASIA
        </div>
        <div
          style={{
            fontSize: 64,
            fontWeight: 800,
            color: "#3B2E2A",
            lineHeight: 1.15,
            marginBottom: 20,
          }}
        >
          Rangkai Bunga Digital, Kirim Pesan Diam-Diam
        </div>
        <div
          style={{
            fontSize: 28,
            color: "#665550",
            lineHeight: 1.4,
          }}
        >
          Kejutan hangat bergaya pastel lewat email — 100% anonim &amp; menjaga privasi.
        </div>
      </div>
    </div>,
    {
      ...size,
    }
  );
}
