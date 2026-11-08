import { describe, expect, it } from "vitest";
import { containsUrl, moderateSubmission, stripUrls } from "@/lib/moderation";

describe("URL detection and stripping in messages", () => {
  it("strips http/https, www, bare domain links, and IP links cleanly", () => {
    const input =
      "Cek hadiahmu di https://phishing-login.xyz/klaim?id=1 atau www.contoh.com dan bit.ly/rahasia123 ya!";
    const stripped = stripUrls(input);

    expect(stripped).toBe("Cek hadiahmu di atau dan ya!");
    expect(containsUrl(stripped)).toBe(false);
  });

  it("preserves normal Indonesian punctuation and multi-line paragraphs without false positives", () => {
    const warmMessage =
      "Hai kamu. Terima kasih sudah selalu ramah di kampus.\nSemoga skripsimu lancar terus ya!";

    expect(containsUrl(warmMessage)).toBe(false);
    expect(stripUrls(warmMessage)).toBe(warmMessage);
  });

  it("detects bare messaging and shortener links used for spam", () => {
    expect(containsUrl("Hubungi aku di wa.me/628123456789")).toBe(true);
    expect(containsUrl("Klik t.me/grup_spam sekarang")).toBe(true);
    expect(containsUrl("Buka 192.168.0.1:8080/admin")).toBe(true);
  });
});

describe("content moderation filter", () => {
  it("allows warm, polite Indonesian messages and sign-offs", () => {
    const result = moderateSubmission({
      recipientName: "Kak Dinda",
      message: "Semangat terus kerjanya hari ini! Senyummu selalu menular.",
      signoff: "dari seseorang yang diam-diam kagum",
    });

    expect(result.allowed).toBe(true);
  });

  it("rejects submissions containing URLs in message or sign-off", () => {
    const inMessage = moderateSubmission({
      message: "Buka hadiahmu di https://evil.example.com",
      signoff: "anonim",
    });
    expect(inMessage.allowed).toBe(false);
    if (!inMessage.allowed) {
      expect(inMessage.code).toBe("URL_NOT_ALLOWED");
    }

    const inSignoff = moderateSubmission({
      message: "Halo selamat pagi!",
      signoff: "cek linktr.ee/akunpalsu",
    });
    expect(inSignoff.allowed).toBe(false);
  });

  it("rejects violent threats and severe slurs", () => {
    const threat = moderateSubmission({
      message: "Awas ya aku bunuh kamu besok",
    });
    expect(threat.allowed).toBe(false);
    if (!threat.allowed) {
      expect(threat.code).toBe("THREAT_OR_SLUR");
    }

    const slur = moderateSubmission({
      message: "Dasar b4j1ng4n tidak tahu diri",
    });
    expect(slur.allowed).toBe(false);
  });
});
