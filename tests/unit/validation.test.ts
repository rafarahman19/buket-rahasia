import { describe, expect, it } from "vitest";
import { validatePngMagicBytes } from "@/lib/security";
import {
  bouquetSchema,
  recipientEmailSchema,
  sendBouquetRequestSchema,
} from "@/lib/validation";

describe("bouquetSchema validation", () => {
  it("accepts a valid bouquet JSON with known flower and greenery types", () => {
    const result = bouquetSchema.safeParse({
      version: 1,
      paper: "blush_pink",
      ribbon: "satin_rose",
      items: [
        { type: "eucalyptus", x: 250, y: 210, scale: 1.1, rotation: -15, z: 0 },
        { type: "rose", x: 300, y: 260, scale: 1.0, rotation: 5, z: 1 },
      ],
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.items).toHaveLength(2);
      expect(result.data.items[1]?.type).toBe("rose");
    }
  });

  it("clamps numeric item coordinates, scale, rotation, and z-index into safe bounds", () => {
    const result = bouquetSchema.safeParse({
      version: 1,
      paper: "sage_green",
      ribbon: "twine_rustic",
      items: [
        {
          type: "tulip",
          x: -500,
          y: 9999,
          scale: 9.5,
          rotation: -720,
          z: 500,
        },
        {
          type: "daisy",
          x: 999,
          y: -10,
          scale: 0.05,
          rotation: 400,
          z: -12,
        },
      ],
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.items[0]).toEqual({
        type: "tulip",
        x: 70,
        y: 500,
        scale: 1.85,
        rotation: -180,
        z: 99,
      });
      expect(result.data.items[1]).toEqual({
        type: "daisy",
        x: 530,
        y: 70,
        scale: 0.45,
        rotation: 180,
        z: 0,
      });
    }
  });

  it("rejects unknown flower types", () => {
    const result = bouquetSchema.safeParse({
      version: 1,
      paper: "blush_pink",
      ribbon: "satin_rose",
      items: [{ type: "poison_ivy", x: 300, y: 250, scale: 1, rotation: 0, z: 0 }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty bouquets and bouquets exceeding 25 items", () => {
    const empty = bouquetSchema.safeParse({
      version: 1,
      paper: "blush_pink",
      ribbon: "satin_rose",
      items: [],
    });
    expect(empty.success).toBe(false);

    const tooManyItems = Array.from({ length: 26 }, (_, i) => ({
      type: "rose",
      x: 300,
      y: 250,
      scale: 1,
      rotation: 0,
      z: i,
    }));
    const overloaded = bouquetSchema.safeParse({
      version: 1,
      paper: "blush_pink",
      ribbon: "satin_rose",
      items: tooManyItems,
    });
    expect(overloaded.success).toBe(false);
  });

  it("rejects unknown extra fields on root object and item objects", () => {
    const extraRoot = bouquetSchema.safeParse({
      version: 1,
      paper: "blush_pink",
      ribbon: "satin_rose",
      items: [{ type: "rose", x: 300, y: 250, scale: 1, rotation: 0, z: 0 }],
      injectedField: "malicious",
    });
    expect(extraRoot.success).toBe(false);

    const extraItem = bouquetSchema.safeParse({
      version: 1,
      paper: "blush_pink",
      ribbon: "satin_rose",
      items: [
        {
          type: "rose",
          x: 300,
          y: 250,
          scale: 1,
          rotation: 0,
          z: 0,
          onload: "alert(1)",
        },
      ],
    });
    expect(extraItem.success).toBe(false);
  });
});

describe("email & request validation", () => {
  it("trims and lowercases valid recipient emails", () => {
    const parsed = recipientEmailSchema.safeParse("  Seseorang.Manis@Contoh.ID ");
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data).toBe("seseorang.manis@contoh.id");
    }
  });

  it("rejects disposable email domains and subdomains", () => {
    expect(recipientEmailSchema.safeParse("test@mailinator.com").success).toBe(false);
    expect(recipientEmailSchema.safeParse("test@sub.tempmail.com").success).toBe(false);
  });

  it("rejects email header injection attempts with newline characters", () => {
    const crlfEmail = recipientEmailSchema.safeParse(
      "target@contoh.id\r\nBcc: attacker@evil.org"
    );
    expect(crlfEmail.success).toBe(false);

    const crlfName = sendBouquetRequestSchema.safeParse({
      bouquet: {
        version: 1,
        paper: "blush_pink",
        ribbon: "satin_rose",
        items: [{ type: "rose", x: 300, y: 250, scale: 1, rotation: 0, z: 0 }],
      },
      recipientEmail: "target@contoh.id",
      recipientName: "Rara\nSubject: Hacked",
      message: "Halo!",
      signoff: null,
      turnstileToken: "valid-token",
      previewPath: "abcdefghijklmnopqrstuvwx.png",
    });
    expect(crlfName.success).toBe(false);
  });
});

describe("PNG magic-byte validation", () => {
  function buildMinimalPng(width: number, height: number): Uint8Array {
    const buf = new Uint8Array(64);
    // 8-byte PNG signature
    buf.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 0);
    const view = new DataView(buf.buffer);
    // IHDR length = 13
    view.setUint32(8, 13, false);
    // "IHDR"
    buf.set([0x49, 0x48, 0x44, 0x52], 12);
    view.setUint32(16, width, false);
    view.setUint32(20, height, false);
    // Trailing IEND chunk
    buf.set([0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82], 52);
    return buf;
  }

  it("accepts a valid PNG header within size and dimension limits", () => {
    const png = buildMinimalPng(480, 544);
    const res = validatePngMagicBytes(png);
    expect(res).toEqual({ valid: true, width: 480, height: 544 });
  });

  it("rejects non-PNG payloads and oversized pixel dimensions", () => {
    const fakeHtml = new TextEncoder().encode(
      "<html><script>alert(1)</script>xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx</html>"
    );
    expect(validatePngMagicBytes(fakeHtml).valid).toBe(false);

    const pixelBomb = buildMinimalPng(9000, 9000);
    expect(validatePngMagicBytes(pixelBomb).valid).toBe(false);
  });
});
