# 🌸 Buket Rahasia — Anonymous Digital Bouquet Builder

**Buket Rahasia** is a production-ready, mobile-first web application where anyone can arrange an original pastel flower bouquet, write a heartfelt note, and send it anonymously ("menfess"-style secret admirer) to a recipient's email. All user-facing copy is written in warm, casual **Bahasa Indonesia**, while all code, comments, and identifiers are in **English**.

---

## Tech Stack

- **Framework**: Next.js 15 (App Router) + React 19 + Strict TypeScript
- **Styling & Fonts**: Tailwind CSS, `Caveat` (handwritten headings & message cards) + `Nunito` (UI) via `next/font/google`
- **Database & Storage**: Supabase (PostgreSQL with Row Level Security + Supabase Storage for PNG previews)
- **Email**: Resend + React Email (responsive table-based HTML template + plain-text alternative + RFC 8058 `List-Unsubscribe`)
- **Bot Protection**: Cloudflare Turnstile (client widget + server-side `/siteverify`)
- **Rate Limiting**: Upstash Redis (`@upstash/ratelimit` sliding-window quotas)
- **Validation & IDs**: Zod (`.strict()`) on every request + `nanoid(24)` unguessable IDs
- **Testing**: Vitest (unit tests) + Playwright (end-to-end browser smoke test)

---

## Quick Start (Local Development)

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure environment variables**

   ```bash
   cp .env.example .env.local
   ```

   Fill in all values in `.env.local` (see [Environment Variables](#environment-variables) and service guides below).

3. **Run the development server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

4. **Run tests, typecheck, and linter**
   ```bash
   npm test            # Vitest unit tests
   npm run typecheck   # Strict TypeScript check
   npm run lint        # ESLint
   npx playwright install chromium
   npm run test:e2e    # Playwright smoke test (uses local mocked providers automatically)
   ```

---

## Environment Variables

Every variable is validated at server boot in `src/lib/env.ts` (invoked via `src/instrumentation.ts`).

| Variable                         | Scope           | Description                                                                                                                                                 |
| -------------------------------- | --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_APP_URL`            | Public & Server | Canonical base URL without trailing slash (e.g., `http://localhost:3000` or `https://buketrahasia.com`). Used for email links and `Origin` CSRF validation. |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Public          | Cloudflare Turnstile site key rendered on the send form (`1x00000000000000000000AA` for local test).                                                        |
| `TURNSTILE_SECRET_KEY`           | **Server-only** | Cloudflare Turnstile secret key verified server-side (`1x0000000000000000000000000000000AA` for local test).                                                |
| `SUPABASE_URL`                   | **Server-only** | Supabase project URL (`https://<project-ref>.supabase.co`).                                                                                                 |
| `SUPABASE_SERVICE_ROLE_KEY`      | **Server-only** | Supabase `service_role` secret key. **Never** expose to client or prefix with `NEXT_PUBLIC_`.                                                               |
| `SUPABASE_STORAGE_BUCKET`        | **Server-only** | Public-read Supabase Storage bucket for rendered bouquet preview PNGs (default: `bouquet-previews`).                                                        |
| `RESEND_API_KEY`                 | **Server-only** | Resend API key (`re_...`) with sending permission on your verified domain.                                                                                  |
| `EMAIL_FROM`                     | **Server-only** | Fixed sender identity on your verified domain, e.g. `Buket Rahasia <hai@yourdomain.com>`.                                                                   |
| `UPSTASH_REDIS_REST_URL`         | **Server-only** | Upstash Redis REST URL (`https://...upstash.io`).                                                                                                           |
| `UPSTASH_REDIS_REST_TOKEN`       | **Server-only** | Upstash Redis REST token.                                                                                                                                   |
| `HASH_PEPPER`                    | **Server-only** | Random secret (`>= 32` chars, e.g. `openssl rand -base64 48`) mixed into SHA-256 hashes of recipient emails and sender IPs.                                 |
| `HMAC_SECRET`                    | **Server-only** | Random secret (`>= 32` chars) used to HMAC-sign and verify recipient block/unsubscribe tokens.                                                              |
| `CRON_SECRET`                    | **Server-only** | Random secret (`>= 24` chars) verified via `Authorization: Bearer <CRON_SECRET>` on `GET /api/cron/cleanup`.                                                |

---

## Step-by-Step Infrastructure Setup

### 1. Supabase Setup (Postgres + Storage + RLS)

1. Create a new project in the [Supabase Dashboard](https://supabase.com/dashboard).
2. Open **SQL Editor → New Query**, paste the entire contents of `supabase/migrations/0001_initial_schema.sql`, and click **Run**.
   - Creates `bouquets`, `blocked_recipients`, `reports`, and `banned_ips`.
   - Enables and forces **Row Level Security (RLS)** on all 4 tables with **zero public policies** and revokes `anon`/`authenticated` privileges.
   - Creates the `bouquet-previews` Storage bucket (`512000` byte cap, `image/png` only, public `SELECT` only).
3. Go to **Project Settings → API** and copy:
   - **Project URL** → `SUPABASE_URL`
   - **`service_role` secret** → `SUPABASE_SERVICE_ROLE_KEY`

---

### 2. Resend Custom Domain, DNS (SPF / DKIM / DMARC), & Warm-Up

1. In the [Resend Dashboard](https://resend.com/domains), click **Add Domain** and enter your domain (e.g. `yourdomain.com` or `mail.yourdomain.com`).
2. Add the DNS records shown by Resend at your DNS provider (Cloudflare, Namecheap, Route53, etc.):
   - **DKIM (DomainKeys Identified Mail)**:
     - Add the `TXT` record(s) (e.g. `resend._domainkey.yourdomain.com`) exactly as provided by Resend so receiving mail servers can cryptographically verify message integrity.
   - **SPF (Sender Policy Framework) & Return-Path**:
     - Add the `MX` record on `send.yourdomain.com` pointing to Resend's feedback/bounce server.
     - Add the `TXT` record on `send.yourdomain.com` with value `v=spf1 include:amazonses.com ~all` (or merge `include:amazonses.com` if a record already exists on that host — never publish two `v=spf1` TXT records on the same hostname).
   - **DMARC (Domain-based Message Authentication, Reporting & Conformance)**:
     - Create a `TXT` record at `_dmarc.yourdomain.com`:
       ```text
       v=DMARC1; p=quarantine; adkim=r; aspf=r; pct=100; rua=mailto:dmarc@yourdomain.com
       ```
     - _Tip_: Start with `p=none` for the first 3–5 days while monitoring aggregate reports (`rua`), then tighten to `p=quarantine` and finally `p=reject` once SPF and DKIM consistently pass.
3. Click **Verify DNS Records** in Resend until status turns **Verified**.
4. Create a Sending API Key under **API Keys** → `RESEND_API_KEY`, and set `EMAIL_FROM="Buket Rahasia <hai@yourdomain.com>"`.
5. **Gradual Sending Warm-Up Note**:
   - Brand-new domains without sending history are scrutinized heavily by Gmail, Yahoo, and Outlook.
   - Start gently (~30–50 emails/day during days 1–3, ~100–250/day during days 4–7, doubling gradually over 2–3 weeks) before announcing large viral campaigns. Keep bounce and spam-complaint rates below `0.1%` (the built-in disposable-email filter, per-recipient rate limit, and one-click `List-Unsubscribe` header directly protect your sender reputation).

---

### 3. Cloudflare Turnstile Setup

1. Open **Cloudflare Dashboard → Turnstile → Add Widget**.
2. Add your production hostname (e.g. `buketrahasia.com`) and choose **Managed** widget mode.
3. Copy:
   - **Site Key** → `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
   - **Secret Key** → `TURNSTILE_SECRET_KEY`

---

### 4. Upstash Redis Setup

1. Open [Upstash Console](https://console.upstash.com/) → **Create Database** (choose the region closest to your Vercel Function region, e.g. Singapore `ap-southeast-1` for Indonesian users).
2. Copy **UPSTASH_REDIS_REST_URL** and **UPSTASH_REDIS_REST_TOKEN** into your environment variables.

---

### 5. Vercel Deployment & 90-Day Cleanup Cron Job

1. Push the repository to GitHub/GitLab/Bitbucket and import it into [Vercel](https://vercel.com/new).
2. Add every variable from `.env.example` under **Project Settings → Environment Variables** (set `NEXT_PUBLIC_APP_URL` to your production `https://...` URL).
3. Ensure `CRON_SECRET` is set in Vercel Production environment variables.
   - `vercel.json` registers `{ "path": "/api/cron/cleanup", "schedule": "0 3 * * *" }` (runs daily at 03:00 UTC).
   - Vercel automatically sends `Authorization: Bearer <CRON_SECRET>` when invoking cron routes.
   - `GET /api/cron/cleanup` deletes all `bouquets` rows older than 90 days along with their corresponding PNG files in Supabase Storage (`bouquet-previews`).

---

## Security Checklist (Section 7 Mapping)

- [x] **Unguessable links (`nanoid(21+)` & identical 404 for unknown/removed IDs)**
  - `nanoid(24)` generated in `src/app/api/send/route.ts` and `src/app/api/upload-preview/route.ts`.
  - DB check constraint `char_length(id) >= 21` in `supabase/migrations/0001_initial_schema.sql`.
  - `getBouquetForRevealAndMarkOpened` in `src/lib/repository.ts` and `src/app/b/[id]/page.tsx` return identical `notFound()` (`src/app/b/[id]/not-found.tsx`) for malformed, nonexistent, and `removed` IDs.
- [x] **Strict Zod input validation, unknown field rejection, email normalization, & disposable-email blocklist**
  - Implemented with `.strict()` schemas, numeric range clamping, max 25 items, `normalizeEmail`, and `DISPOSABLE_EMAIL_DOMAINS` in `src/lib/validation.ts`.
- [x] **XSS & SQL injection prevention**
  - Plain React text rendering only in `src/components/bouquet/RevealExperience.tsx` and `src/components/bouquet/SendStepPanel.tsx` (`dangerouslySetInnerHTML` is never used anywhere).
  - React Email auto-escapes `recipientName` in `src/emails/BouquetInviteEmail.tsx`.
  - Parameterized PostgREST queries via `@supabase/supabase-js` in `src/lib/repository.ts`.
- [x] **Email header injection prevention**
  - `NO_HEADER_INJECTION_REGEX` in `src/lib/validation.ts` rejects `\r`, `\n`, and control characters in email, recipient name, and sign-off.
  - Fixed `EMAIL_FROM` and fixed `FIXED_EMAIL_SUBJECT` (`"Ada yang diam-diam ngirim bunga buat kamu 🌸"`) in `src/lib/mailer.ts` and `src/emails/BouquetInviteEmail.tsx` never interpolate user text.
- [x] **Cloudflare Turnstile bot protection**
  - Client widget in `src/components/ui/TurnstileWidget.tsx`; verified server-side on every `POST /api/send` via `verifyTurnstileToken` in `src/lib/turnstile.ts`.
- [x] **Distributed rate limiting (Upstash Redis) with Indonesian 429 errors**
  - Implemented in `src/lib/rate-limit.ts`: per IP (`3 / 10m`, `10 / 24h`), per recipient email hash (`2 / 24h`, `5 / 7d`), plus separate stricter limits on `/api/upload-preview` (`12 / 10m`), `/api/report` (`5 / 1h`), and `/api/block` (`10 / 1h`).
- [x] **Abuse deterrence without breaking anonymity (hashed IP & email + IP-hash banlist)**
  - Peppered SHA-256 hashing (`hashWithPepper`) in `src/lib/crypto.ts`.
  - `banned_ips` table in `supabase/migrations/0001_initial_schema.sql`, checked via `isIpHashBanned` in `src/app/api/send/route.ts` and `src/app/api/upload-preview/route.ts`, with automatic ban after `>= 3` reported bouquets in `reportBouquetById` (`src/lib/repository.ts`).
- [x] **Content moderation & anti-phishing URL rejection/stripping**
  - `containsUrl`, `stripUrls`, and `moderateSubmission` in `src/lib/moderation.ts` block URLs/links, violent threats, and slurs; `src/app/api/send/route.ts` logs rejected attempts with truncated hashed identifiers only.
- [x] **Boot-time secret validation & server-only isolation**
  - Validated with Zod in `src/lib/env.ts` + `src/instrumentation.ts`; guarded by `import "server-only"` across `env.ts`, `repository.ts`, `mailer.ts`, `rate-limit.ts`, and `turnstile.ts`.
- [x] **Security headers (CSP, `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`, `Permissions-Policy`)**
  - Configured in `next.config.ts`, allowing only self and Cloudflare Turnstile origins.
- [x] **Reveal page search engine isolation (`noindex, nofollow`, `X-Robots-Tag`, `robots.txt`)**
  - `robots` metadata in `src/app/b/[id]/page.tsx`, `X-Robots-Tag: noindex, nofollow, noarchive, nosnippet` header in `next.config.ts`, and `disallow: ["/b/"]` in `src/app/robots.ts`.
  - Generic non-leaking OG image in `src/app/b/[id]/opengraph-image.tsx`.
- [x] **CSRF `Origin` header validation**
  - `verifyRequestOrigin` in `src/lib/security.ts`, enforced on `POST /api/send`, `POST /api/upload-preview`, `POST /api/report`, and JSON `POST /api/block`.
- [x] **HMAC-signed unsubscribe / block tokens**
  - `signBlockTokenWithSecret` and constant-time `verifyBlockTokenWithSecret` (`timingSafeEqual`) in `src/lib/crypto.ts`, consumed by `POST /api/block` (`src/app/api/block/route.ts`) and `/blokir` (`src/app/blokir/page.tsx`).
- [x] **PNG magic-byte & 500 KB upload validation + anti-tracking URL construction**
  - `validatePngMagicBytes` in `src/lib/security.ts` verifies 8-byte PNG signature, `IHDR` dimensions, `IEND` trailer, and `<= 500 KB` limit in `src/app/api/upload-preview/route.ts`; hosted URL built server-side in `buildPublicPreviewUrl` (`src/lib/repository.ts`).
- [x] **Safe error handling (no stack trace or DB error leakage)**
  - Catch blocks across all API routes (`src/app/api/**/route.ts`) and `src/app/error.tsx` log server-side only and return friendly Bahasa Indonesia messages.
- [x] **Indonesian Privacy (`/privasi`) & Terms (`/ketentuan`) pages + 90-day Cron retention**
  - Implemented in `src/app/privasi/page.tsx`, `src/app/ketentuan/page.tsx`, `src/app/api/cron/cleanup/route.ts`, and `vercel.json`.
