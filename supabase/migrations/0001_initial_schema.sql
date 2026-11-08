-- =============================================================================
-- Buket Rahasia — Initial Database & Storage Schema Migration
-- Database: Supabase (PostgreSQL 15+)
-- Security Model: Row Level Security (RLS) enabled on ALL tables with ZERO
-- public policies. All reads and writes go exclusively through Next.js server
-- route handlers and server components using the Supabase service-role key.
-- =============================================================================

create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- 1. Table: bouquets
-- Stores compact bouquet JSON, message, optional sign-off, optional recipient
-- greeting name, storage preview filename, and one-way peppered SHA-256 hashes.
-- Plain recipient emails and raw sender IPs are NEVER stored.
-- -----------------------------------------------------------------------------
create table if not exists public.bouquets (
  id text primary key
    constraint bouquets_id_min_length check (char_length(id) >= 21 and char_length(id) <= 64),
  bouquet_json jsonb not null,
  message text not null
    constraint bouquets_message_length check (char_length(message) >= 1 and char_length(message) <= 500),
  signoff text null
    constraint bouquets_signoff_length check (signoff is null or char_length(signoff) <= 60),
  recipient_name text null
    constraint bouquets_recipient_name_length check (recipient_name is null or char_length(recipient_name) <= 60),
  preview_path text null
    constraint bouquets_preview_path_format check (
      preview_path is null or preview_path ~ '^[A-Za-z0-9_-]{21,48}\.png$'
    ),
  recipient_email_hash text not null
    constraint bouquets_recipient_hash_hex check (recipient_email_hash ~ '^[a-f0-9]{64}$'),
  sender_ip_hash text not null
    constraint bouquets_sender_ip_hash_hex check (sender_ip_hash ~ '^[a-f0-9]{64}$'),
  created_at timestamptz not null default now(),
  opened_at timestamptz null,
  status text not null default 'active'
    constraint bouquets_status_enum check (status in ('active', 'reported', 'removed'))
);

create index if not exists idx_bouquets_created_at
  on public.bouquets (created_at);

create index if not exists idx_bouquets_sender_ip_hash
  on public.bouquets (sender_ip_hash);

create index if not exists idx_bouquets_status
  on public.bouquets (status);

-- -----------------------------------------------------------------------------
-- 2. Table: blocked_recipients
-- Stores peppered SHA-256 email hashes of recipients who opted out via signed
-- unsubscribe / block links.
-- -----------------------------------------------------------------------------
create table if not exists public.blocked_recipients (
  email_hash text primary key
    constraint blocked_recipients_hash_hex check (email_hash ~ '^[a-f0-9]{64}$'),
  created_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- 3. Table: reports
-- Records abuse reports submitted from the reveal page or email report link.
-- -----------------------------------------------------------------------------
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  bouquet_id text not null references public.bouquets (id) on delete cascade,
  reason text null
    constraint reports_reason_length check (reason is null or char_length(reason) <= 500),
  reporter_ip_hash text null
    constraint reports_ip_hash_hex check (reporter_ip_hash is null or reporter_ip_hash ~ '^[a-f0-9]{64}$'),
  created_at timestamptz not null default now()
);

create index if not exists idx_reports_bouquet_id
  on public.reports (bouquet_id);

-- -----------------------------------------------------------------------------
-- 4. Table: banned_ips
-- Stores peppered SHA-256 IP hashes banned due to repeated abuse reports or
-- moderation enforcement. Checked on send & preview upload without storing raw IPs.
-- -----------------------------------------------------------------------------
create table if not exists public.banned_ips (
  ip_hash text primary key
    constraint banned_ips_hash_hex check (ip_hash ~ '^[a-f0-9]{64}$'),
  reason text null
    constraint banned_ips_reason_length check (reason is null or char_length(reason) <= 300),
  created_at timestamptz not null default now(),
  expires_at timestamptz null
);

-- -----------------------------------------------------------------------------
-- 5. Enable Row Level Security (RLS) with NO public policies
-- Explicitly revoke anon and authenticated privileges on all application tables.
-- -----------------------------------------------------------------------------
alter table public.bouquets enable row level security;
alter table public.blocked_recipients enable row level security;
alter table public.reports enable row level security;
alter table public.banned_ips enable row level security;

alter table public.bouquets force row level security;
alter table public.blocked_recipients force row level security;
alter table public.reports force row level security;
alter table public.banned_ips force row level security;

revoke all on table public.bouquets from public, anon, authenticated;
revoke all on table public.blocked_recipients from public, anon, authenticated;
revoke all on table public.reports from public, anon, authenticated;
revoke all on table public.banned_ips from public, anon, authenticated;

grant all on table public.bouquets to service_role;
grant all on table public.blocked_recipients to service_role;
grant all on table public.reports to service_role;
grant all on table public.banned_ips to service_role;

-- -----------------------------------------------------------------------------
-- 6. Supabase Storage Bucket: bouquet-previews
-- Publicly readable so Gmail/Outlook/Apple Mail image proxies can fetch the
-- bouquet preview PNG; strictly non-writable by anon/authenticated clients
-- (uploads and 90-day deletions occur solely via service_role on the server).
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'bouquet-previews',
  'bouquet-previews',
  true,
  512000,
  array['image/png']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public read access for bouquet previews" on storage.objects;
create policy "Public read access for bouquet previews"
  on storage.objects
  for select
  to public
  using (bucket_id = 'bouquet-previews');
