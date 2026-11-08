/**
 * Content moderation & URL anti-phishing utilities.
 * Prevents links, phishing URLs, violent threats, and severe harassment/slurs.
 */

const EXPLICIT_PROTOCOL_OR_WWW_REGEX =
  /\b(?:(?:https?|ftp):\/\/|mailto:|www\.)[^\s<>()"]+/gi;

const IPV4_URL_REGEX = /\b(?:\d{1,3}\.){3}\d{1,3}(?::\d{2,5})?(?:\/[^\s<>()"]*)?\b/g;

// Matches either:
// 1. Any `hostname.<2-12 letter tld>/<non-empty-path>` (e.g. `linktr.ee/akun`, `youtu.be/xyz`), OR
// 2. Bare `hostname.<known TLD>` even without a trailing slash.
// Requires no whitespace around dots so normal Indonesian sentences ("Halo. Apa kabar") never false-positive.
const BARE_DOMAIN_WITH_PATH_REGEX =
  /\b(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,12}\/[^\s<>()"]*/gi;

const BARE_DOMAIN_URL_REGEX =
  /\b(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+(?:com|id|co\.id|my\.id|web\.id|or\.id|ac\.id|net|org|io|app|dev|me|ly|gg|ee|be|gl|xyz|online|site|top|click|link|page|bio|social|live|pro|vip|fun|asia|info|biz|shop|store|tech|cloud|ai|co|tv|cc|to|in|us|uk|sg)(?:\/[^\s<>()"]*)?\b/gi;

export function containsUrl(text: string): boolean {
  if (!text) return false;
  EXPLICIT_PROTOCOL_OR_WWW_REGEX.lastIndex = 0;
  IPV4_URL_REGEX.lastIndex = 0;
  BARE_DOMAIN_WITH_PATH_REGEX.lastIndex = 0;
  BARE_DOMAIN_URL_REGEX.lastIndex = 0;

  return (
    EXPLICIT_PROTOCOL_OR_WWW_REGEX.test(text) ||
    IPV4_URL_REGEX.test(text) ||
    BARE_DOMAIN_WITH_PATH_REGEX.test(text) ||
    BARE_DOMAIN_URL_REGEX.test(text)
  );
}

/**
 * Strips protocol URLs, `www.` links, IP links, and bare domain links from text
 * while preserving intentional line breaks and cleaning up extra spaces.
 */
export function stripUrls(text: string): string {
  if (!text) return "";

  const withoutUrls = text
    .replace(EXPLICIT_PROTOCOL_OR_WWW_REGEX, " ")
    .replace(IPV4_URL_REGEX, " ")
    .replace(BARE_DOMAIN_WITH_PATH_REGEX, " ")
    .replace(BARE_DOMAIN_URL_REGEX, " ");

  return withoutUrls
    .split("\n")
    .map((line) => line.replace(/[ \t]{2,}/g, " ").trim())
    .join("\n")
    .trim();
}

function normalizeForAbuseScan(text: string): string {
  return text
    .toLowerCase()
    .replace(/0/g, "o")
    .replace(/1/g, "i")
    .replace(/3/g, "e")
    .replace(/4/g, "a")
    .replace(/5/g, "s")
    .replace(/@/g, "a")
    .replace(/\$/g, "s")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Threats & severe harassment phrases (Indonesian & English)
const THREAT_PATTERNS: readonly RegExp[] = [
  /\bbunuh\s+(?:kamu|kau|elo|lo|lu|diri(?:mu)?)\b/,
  /\b(?:aku|gue|gw)\s+bunuh\b/,
  /\bmati\s+(?:aja|saja)\s+(?:kamu|kau|lo|lu)\b/,
  /\bperkosa\b/,
  /\bsantet\s+(?:kamu|lo|lu)\b/,
  /\bancam\s+bunuh\b/,
  /\bbakar\s+rumah(?:mu)?\b/,
  /\bkill\s+your\s*self\b/,
  /\bkys\b/,
  /\bi\s+will\s+kill\s+you\b/,
  /\brape\s+you\b/,
];

// Severe slurs & abusive terms (Indonesian & English)
const SLUR_PATTERNS: readonly RegExp[] = [
  /\bpelacur\b/,
  /\blonte\b/,
  /\bperek\b/,
  /\bjalang\b/,
  /\bbajingan\b/,
  /\bkeparat\b/,
  /\bkontol\b/,
  /\bmemek\b/,
  /\bngentot\b/,
  /\bjancok\b/,
  /\bjancuk\b/,
  /\bnigger\b/,
  /\bfaggot\b/,
  /\bwhore\b/,
  /\bslut\b/,
  /\bcunt\b/,
];

export type ModerationRejectionCode = "URL_NOT_ALLOWED" | "THREAT_OR_SLUR";

export type ModerationResult =
  | { allowed: true }
  | {
      allowed: false;
      code: ModerationRejectionCode;
      userMessage: string;
    };

export function moderateSubmission(fields: {
  message: string;
  signoff?: string | null;
  recipientName?: string | null;
}): ModerationResult {
  const combinedRaw = [
    fields.recipientName ?? "",
    fields.message,
    fields.signoff ?? "",
  ].join("\n");

  if (containsUrl(combinedRaw)) {
    return {
      allowed: false,
      code: "URL_NOT_ALLOWED",
      userMessage:
        "Demi keamanan penerima, pesan dan salam penutup tidak boleh berisi tautan atau alamat website ya.",
    };
  }

  const normalized = normalizeForAbuseScan(combinedRaw);

  for (const pattern of THREAT_PATTERNS) {
    if (pattern.test(normalized)) {
      return {
        allowed: false,
        code: "THREAT_OR_SLUR",
        userMessage:
          " Buket Rahasia hanya untuk pesan yang hangat dan sopan. Pesan dengan ancaman atau kekerasan tidak dapat dikirim.".trim(),
      };
    }
  }

  for (const pattern of SLUR_PATTERNS) {
    if (pattern.test(normalized)) {
      return {
        allowed: false,
        code: "THREAT_OR_SLUR",
        userMessage:
          "Yuk gunakan kata-kata yang sopan dan hangat. Pesan dengan kata kasar atau hinaan tidak dapat dikirim.",
      };
    }
  }

  return { allowed: true };
}
