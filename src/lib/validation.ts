import { z } from "zod";
import {
  ALL_ELEMENT_TYPES,
  MAX_BOUQUET_ITEMS,
  MAX_ITEM_ROTATION,
  MAX_ITEM_SCALE,
  MAX_ITEM_X,
  MAX_ITEM_Y,
  MAX_ITEM_Z,
  MIN_ITEM_ROTATION,
  MIN_ITEM_SCALE,
  MIN_ITEM_X,
  MIN_ITEM_Y,
  MIN_ITEM_Z,
  PAPER_TYPES,
  RIBBON_TYPES,
} from "./bouquet-catalog";

/**
 * Curated blocklist of disposable / throwaway email domains to reduce spam and abuse.
 */
export const DISPOSABLE_EMAIL_DOMAINS = new Set<string>([
  "10minutemail.com",
  "10minutemail.net",
  "20minutemail.com",
  "anonbox.net",
  "bccto.me",
  "burnermail.io",
  "chacuo.net",
  "cock.li",
  "discard.email",
  "discardmail.com",
  "dispostable.com",
  "dropmail.me",
  "emailondeck.com",
  "fakeinbox.com",
  "fakemail.net",
  "fakemailgenerator.com",
  "getairmail.com",
  "getnada.com",
  "grr.la",
  "guerrillamail.biz",
  "guerrillamail.com",
  "guerrillamail.de",
  "guerrillamail.info",
  "guerrillamail.net",
  "guerrillamail.org",
  "guerrillamailblock.com",
  "harakirimail.com",
  "inboxbear.com",
  "inboxkitten.com",
  "jetable.org",
  "linshiyouxiang.net",
  "mailcatch.com",
  "maildrop.cc",
  "mailexpire.com",
  "mailforspam.com",
  "mailinator.com",
  "mailinator.net",
  "mailnesia.com",
  "mailnull.com",
  "mailsac.com",
  "mintemail.com",
  "mohmal.com",
  "moakt.com",
  "mytemp.email",
  "nada.email",
  "nowmymail.com",
  "pokemail.net",
  "sharklasers.com",
  "spam4.me",
  "spambox.us",
  "spamgourmet.com",
  "temp-mail.io",
  "temp-mail.org",
  "tempail.com",
  "tempinbox.com",
  "tempmail.com",
  "tempmail.dev",
  "tempmail.net",
  "tempmail.plus",
  "tempmailaddress.com",
  "tempmailo.com",
  "throwaway.email",
  "throwawaymail.com",
  "tmail.ws",
  "tmpmail.net",
  "tmpmail.org",
  "trashmail.com",
  "trashmail.de",
  "trashmail.me",
  "trashmail.net",
  "yopmail.com",
  "yopmail.fr",
  "yopmail.net",
]);

function clampRound(value: number, min: number, max: number): number {
  const clamped = Math.min(max, Math.max(min, value));
  return Math.round(clamped * 100) / 100;
}

function clampInt(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.trunc(value)));
}

const NO_HEADER_INJECTION_REGEX = /^[^\r\n\x00-\x1F\x7F]*$/;

export function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

export function isDisposableEmailDomain(email: string): boolean {
  const atIndex = email.lastIndexOf("@");
  if (atIndex === -1) return false;
  const domain = email
    .slice(atIndex + 1)
    .toLowerCase()
    .trim();
  if (!domain) return false;

  if (DISPOSABLE_EMAIL_DOMAINS.has(domain)) {
    return true;
  }

  for (const blocked of DISPOSABLE_EMAIL_DOMAINS) {
    if (domain.endsWith(`.${blocked}`)) {
      return true;
    }
  }
  return false;
}

export const bouquetItemSchema = z
  .object({
    type: z.enum(ALL_ELEMENT_TYPES, {
      errorMap: () => ({ message: "Jenis bunga atau daun tidak dikenali." }),
    }),
    x: z
      .number({ invalid_type_error: "Posisi X harus berupa angka." })
      .finite("Posisi X tidak valid.")
      .transform((val) => clampRound(val, MIN_ITEM_X, MAX_ITEM_X)),
    y: z
      .number({ invalid_type_error: "Posisi Y harus berupa angka." })
      .finite("Posisi Y tidak valid.")
      .transform((val) => clampRound(val, MIN_ITEM_Y, MAX_ITEM_Y)),
    scale: z
      .number({ invalid_type_error: "Ukuran elemen harus berupa angka." })
      .finite("Ukuran elemen tidak valid.")
      .transform((val) => clampRound(val, MIN_ITEM_SCALE, MAX_ITEM_SCALE)),
    rotation: z
      .number({ invalid_type_error: "Rotasi elemen harus berupa angka." })
      .finite("Rotasi elemen tidak valid.")
      .transform((val) => clampRound(val, MIN_ITEM_ROTATION, MAX_ITEM_ROTATION)),
    z: z
      .number({ invalid_type_error: "Urutan layer harus berupa angka." })
      .finite("Urutan layer tidak valid.")
      .transform((val) => clampInt(val, MIN_ITEM_Z, MAX_ITEM_Z)),
  })
  .strict();

export const bouquetSchema = z
  .object({
    version: z.literal(1, {
      errorMap: () => ({ message: "Versi format buket tidak didukung." }),
    }),
    paper: z.enum(PAPER_TYPES, {
      errorMap: () => ({ message: "Pilihan kertas pembungkus tidak valid." }),
    }),
    ribbon: z.enum(RIBBON_TYPES, {
      errorMap: () => ({ message: "Pilihan pita buket tidak valid." }),
    }),
    items: z
      .array(bouquetItemSchema)
      .min(1, "Tambahkan minimal 1 bunga atau daun ke buketmu ya.")
      .max(
        MAX_BOUQUET_ITEMS,
        `Buket maksimal berisi ${MAX_BOUQUET_ITEMS} elemen supaya tetap rapi.`
      ),
  })
  .strict();

export const recipientEmailSchema = z
  .string({ required_error: "Email penerima wajib diisi." })
  .max(320, "Alamat email terlalu panjang.")
  .refine((val) => NO_HEADER_INJECTION_REGEX.test(val), {
    message: "Format email tidak valid.",
  })
  .transform(normalizeEmail)
  .pipe(
    z
      .string()
      .min(5, "Email penerima terlalu pendek.")
      .max(254, "Alamat email terlalu panjang.")
      .email("Format alamat email belum valid.")
      .refine((email) => !isDisposableEmailDomain(email), {
        message:
          "Email sementara (disposable email) tidak didukung. Gunakan email aktif penerima ya.",
      })
  );

const optionalSingleLineField = (maxLen: number, label: string) =>
  z
    .string()
    .refine((val) => NO_HEADER_INJECTION_REGEX.test(val), {
      message: `${label} tidak boleh mengandung baris baru atau karakter kontrol.`,
    })
    .transform((val) => val.trim())
    .refine((val) => val.length <= maxLen, {
      message: `${label} maksimal ${maxLen} karakter.`,
    })
    .transform((val) => (val.length === 0 ? null : val))
    .nullable()
    .optional()
    .transform((val) => val ?? null);

export const previewPathSchema = z
  .string()
  .regex(/^[A-Za-z0-9_-]{21,48}\.png$/, "Identitas gambar pratinjau tidak valid.");

export const bouquetIdSchema = z
  .string()
  .regex(/^[A-Za-z0-9_-]{21,64}$/, "ID buket tidak valid.");

export function isValidBouquetId(id: string): boolean {
  return bouquetIdSchema.safeParse(id).success;
}

export const sendBouquetRequestSchema = z
  .object({
    bouquet: bouquetSchema,
    recipientEmail: recipientEmailSchema,
    recipientName: optionalSingleLineField(60, "Nama penerima"),
    message: z
      .string({ required_error: "Pesan rahasia wajib diisi." })
      .refine((val) => !/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(val), {
        message: "Pesan mengandung karakter yang tidak diizinkan.",
      })
      .transform((val) => val.replace(/\r\n/g, "\n").trim())
      .pipe(
        z
          .string()
          .min(1, "Tulis pesan singkat untuk penerima dulu ya.")
          .max(500, "Pesan maksimal 500 karakter.")
      ),
    signoff: optionalSingleLineField(60, "Salam penutup"),
    turnstileToken: z
      .string({ required_error: "Verifikasi anti-bot wajib diselesaikan." })
      .trim()
      .min(1, "Selesaikan verifikasi keamanan terlebih dahulu.")
      .max(4096, "Token keamanan tidak valid."),
    previewPath: previewPathSchema,
  })
  .strict();

export const reportRequestSchema = z
  .object({
    bouquetId: bouquetIdSchema,
    reason: z
      .string()
      .refine((val) => !/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(val), {
        message: "Alasan mengandung karakter tidak valid.",
      })
      .transform((val) => val.trim())
      .refine((val) => val.length <= 500, {
        message: "Alasan laporan maksimal 500 karakter.",
      })
      .transform((val) => (val.length === 0 ? null : val))
      .nullable()
      .optional()
      .transform((val) => val ?? null),
  })
  .strict();

export const blockRequestSchema = z
  .object({
    token: z
      .string({ required_error: "Token blokir wajib disertakan." })
      .trim()
      .min(20, "Token tidak valid.")
      .max(1024, "Token tidak valid."),
  })
  .strict();

export type SendBouquetInput = z.infer<typeof sendBouquetRequestSchema>;
export type ReportInput = z.infer<typeof reportRequestSchema>;
export type BlockInput = z.infer<typeof blockRequestSchema>;
