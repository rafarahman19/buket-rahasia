const PNG_SIGNATURE = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
export const MAX_PREVIEW_PNG_BYTES = 500 * 1024; // 500 KB
const MAX_PNG_DIMENSION = 2400;

export type PngValidationResult =
  { valid: true; width: number; height: number } | { valid: false; error: string };

/**
 * Validates that a byte buffer is an authentic PNG image under 500 KB by checking:
 * 1. Exact 8-byte PNG magic header (`89 50 4E 47 0D 0A 1A 0A`)
 * 2. Valid `IHDR` first chunk with bounded width/height (prevents pixel-flood bombs)
 * 3. Presence of trailing `IEND` chunk marker
 */
export function validatePngMagicBytes(bytes: Uint8Array): PngValidationResult {
  if (bytes.byteLength === 0) {
    return { valid: false, error: "File gambar kosong." };
  }

  if (bytes.byteLength > MAX_PREVIEW_PNG_BYTES) {
    return {
      valid: false,
      error: "Ukuran gambar pratinjau melebihi batas 500 KB.",
    };
  }

  // Minimum valid PNG size: 8 (sig) + 25 (IHDR) + 12 (IDAT) + 12 (IEND) = 57 bytes
  if (bytes.byteLength < 57) {
    return { valid: false, error: "File PNG tidak lengkap atau rusak." };
  }

  for (let i = 0; i < PNG_SIGNATURE.length; i++) {
    if (bytes[i] !== PNG_SIGNATURE[i]) {
      return {
        valid: false,
        error: "Format file tidak valid. Hanya gambar PNG yang diizinkan.",
      };
    }
  }

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const ihdrLength = view.getUint32(8, false);
  const ihdrType = String.fromCharCode(bytes[12]!, bytes[13]!, bytes[14]!, bytes[15]!);

  if (ihdrLength !== 13 || ihdrType !== "IHDR") {
    return { valid: false, error: "Header gambar PNG (IHDR) tidak valid." };
  }

  const width = view.getUint32(16, false);
  const height = view.getUint32(20, false);

  if (
    width < 1 ||
    height < 1 ||
    width > MAX_PNG_DIMENSION ||
    height > MAX_PNG_DIMENSION
  ) {
    return {
      valid: false,
      error: "Dimensi gambar pratinjau tidak sesuai batas.",
    };
  }

  // Verify trailing IEND chunk (last 12 bytes: 00 00 00 00 49 45 4E 44 AE 42 60 82)
  const tailOffset = bytes.byteLength - 8;
  const iendTag = String.fromCharCode(
    bytes[tailOffset]!,
    bytes[tailOffset + 1]!,
    bytes[tailOffset + 2]!,
    bytes[tailOffset + 3]!
  );
  if (iendTag !== "IEND") {
    return { valid: false, error: "Penutup file PNG (IEND) tidak ditemukan." };
  }

  return { valid: true, width, height };
}

/**
 * Verifies the `Origin` header on state-changing POST requests to prevent CSRF.
 */
export function verifyRequestOrigin(request: Request, configuredAppUrl: string): boolean {
  const originHeader = request.headers.get("origin");
  if (!originHeader) {
    return false;
  }

  let originHost: string;
  try {
    originHost = new URL(originHeader).host.toLowerCase();
  } catch {
    return false;
  }

  const allowedHosts = new Set<string>();
  try {
    allowedHosts.add(new URL(configuredAppUrl).host.toLowerCase());
  } catch {
    // Ignore malformed configuredAppUrl; fall through to request host check
  }

  const hostHeader = (
    request.headers.get("x-forwarded-host") ??
    request.headers.get("host") ??
    ""
  )
    .split(",")[0]
    ?.trim()
    .toLowerCase();

  if (hostHeader) {
    allowedHosts.add(hostHeader);
  }

  return allowedHosts.has(originHost);
}

/**
 * Extracts the client IP address from Vercel / reverse-proxy headers without
 * persisting or logging the raw value anywhere.
 */
export function extractClientIp(request: Request): string {
  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) {
    return realIp;
  }

  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const firstHop = forwardedFor.split(",")[0]?.trim();
    if (firstHop) {
      return firstHop;
    }
  }

  return "127.0.0.1";
}
