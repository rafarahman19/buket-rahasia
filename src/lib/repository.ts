import "server-only";
import fs from "node:fs";
import path from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { BouquetJson } from "./bouquet-catalog";
import { getServerEnv, isE2EMockMode } from "./env";

export type BouquetStatus = "active" | "reported" | "removed";

export interface BouquetRecord {
  id: string;
  bouquet_json: BouquetJson;
  message: string;
  signoff: string | null;
  recipient_name: string | null;
  preview_path: string | null;
  recipient_email_hash: string;
  sender_ip_hash: string;
  created_at: string;
  opened_at: string | null;
  status: BouquetStatus;
}

const AUTO_BAN_REPORTED_BOUQUET_THRESHOLD = 3;

let cachedSupabaseAdmin: SupabaseClient | null = null;

function getSupabaseAdmin(): SupabaseClient {
  if (cachedSupabaseAdmin) {
    return cachedSupabaseAdmin;
  }

  const env = getServerEnv();
  cachedSupabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
  return cachedSupabaseAdmin;
}

// -----------------------------------------------------------------------------
// Local file-backed E2E test store (ONLY used when E2E_MOCK_SERVICES === "true"
// outside Vercel production so Next.js dev worker processes share state cleanly).
// -----------------------------------------------------------------------------
interface E2EStoreState {
  bouquets: Record<string, BouquetRecord>;
  blockedRecipients: string[];
  bannedIps: Record<string, { reason: string | null; expiresAt: string | null }>;
  reports: Array<{
    id: string;
    bouquet_id: string;
    reason: string | null;
    reporter_ip_hash: string | null;
    created_at: string;
  }>;
  previews: string[];
}

function getE2EStoreDir(): string {
  return path.join(process.cwd(), ".e2e-outbox");
}

function getE2EStoreFile(): string {
  return path.join(getE2EStoreDir(), "mock-db.json");
}

function readE2EStore(): E2EStoreState {
  const file = getE2EStoreFile();
  if (!fs.existsSync(file)) {
    return {
      bouquets: {},
      blockedRecipients: [],
      bannedIps: {},
      reports: [],
      previews: [],
    };
  }
  return JSON.parse(fs.readFileSync(file, "utf8")) as E2EStoreState;
}

function writeE2EStore(state: E2EStoreState): void {
  const dir = getE2EStoreDir();
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(getE2EStoreFile(), JSON.stringify(state, null, 2), "utf8");
}

// -----------------------------------------------------------------------------
// Repository Operations
// -----------------------------------------------------------------------------

export async function isIpHashBanned(ipHash: string): Promise<boolean> {
  if (isE2EMockMode()) {
    const store = readE2EStore();
    const entry = store.bannedIps[ipHash];
    if (!entry) return false;
    if (entry.expiresAt && new Date(entry.expiresAt).getTime() <= Date.now()) {
      return false;
    }
    return true;
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("banned_ips")
    .select("ip_hash, expires_at")
    .eq("ip_hash", ipHash)
    .maybeSingle();

  if (error || !data) {
    return false;
  }

  if (data.expires_at && new Date(data.expires_at as string).getTime() <= Date.now()) {
    return false;
  }

  return true;
}

export async function isRecipientEmailHashBlocked(emailHash: string): Promise<boolean> {
  if (isE2EMockMode()) {
    const store = readE2EStore();
    return store.blockedRecipients.includes(emailHash);
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("blocked_recipients")
    .select("email_hash")
    .eq("email_hash", emailHash)
    .maybeSingle();

  if (error) {
    throw new Error("Failed to check recipient blocklist.");
  }

  return Boolean(data);
}

export async function addBlockedRecipientHash(emailHash: string): Promise<void> {
  if (isE2EMockMode()) {
    const store = readE2EStore();
    if (!store.blockedRecipients.includes(emailHash)) {
      store.blockedRecipients.push(emailHash);
      writeE2EStore(store);
    }
    return;
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("blocked_recipients")
    .upsert({ email_hash: emailHash }, { onConflict: "email_hash" });

  if (error) {
    throw new Error("Failed to store blocked recipient hash.");
  }
}

export async function uploadPreviewPng(
  filename: string,
  pngBytes: Uint8Array
): Promise<string> {
  const env = getServerEnv();

  if (isE2EMockMode()) {
    const dir = path.join(getE2EStoreDir(), "previews");
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, filename), Buffer.from(pngBytes));
    const store = readE2EStore();
    if (!store.previews.includes(filename)) {
      store.previews.push(filename);
      writeE2EStore(store);
    }
    return filename;
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.storage
    .from(env.SUPABASE_STORAGE_BUCKET)
    .upload(filename, pngBytes, {
      contentType: "image/png",
      cacheControl: "31536000",
      upsert: false,
    });

  if (error) {
    throw new Error("Failed to upload bouquet preview PNG.");
  }

  return filename;
}

export function buildPublicPreviewUrl(previewPath: string): string {
  const env = getServerEnv();
  if (isE2EMockMode()) {
    return `${env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "")}/og-preview-mock/${encodeURIComponent(previewPath)}`;
  }

  const supabase = getSupabaseAdmin();
  const { data } = supabase.storage
    .from(env.SUPABASE_STORAGE_BUCKET)
    .getPublicUrl(previewPath);
  return data.publicUrl;
}

export async function deletePreviewPngs(paths: string[]): Promise<void> {
  if (paths.length === 0) return;
  const env = getServerEnv();

  if (isE2EMockMode()) {
    const store = readE2EStore();
    store.previews = store.previews.filter((item) => !paths.includes(item));
    writeE2EStore(store);
    for (const p of paths) {
      const target = path.join(getE2EStoreDir(), "previews", p);
      if (fs.existsSync(target)) {
        fs.unlinkSync(target);
      }
    }
    return;
  }

  const supabase = getSupabaseAdmin();
  await supabase.storage.from(env.SUPABASE_STORAGE_BUCKET).remove(paths);
}

export async function insertBouquetRecord(input: {
  id: string;
  bouquetJson: BouquetJson;
  message: string;
  signoff: string | null;
  recipientName: string | null;
  previewPath: string | null;
  recipientEmailHash: string;
  senderIpHash: string;
}): Promise<void> {
  if (isE2EMockMode()) {
    const store = readE2EStore();
    store.bouquets[input.id] = {
      id: input.id,
      bouquet_json: input.bouquetJson,
      message: input.message,
      signoff: input.signoff,
      recipient_name: input.recipientName,
      preview_path: input.previewPath,
      recipient_email_hash: input.recipientEmailHash,
      sender_ip_hash: input.senderIpHash,
      created_at: new Date().toISOString(),
      opened_at: null,
      status: "active",
    };
    writeE2EStore(store);
    return;
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("bouquets").insert({
    id: input.id,
    bouquet_json: input.bouquetJson,
    message: input.message,
    signoff: input.signoff,
    recipient_name: input.recipientName,
    preview_path: input.previewPath,
    recipient_email_hash: input.recipientEmailHash,
    sender_ip_hash: input.senderIpHash,
    status: "active",
  });

  if (error) {
    throw new Error("Failed to insert bouquet record.");
  }
}

export async function deleteBouquetById(id: string): Promise<void> {
  if (isE2EMockMode()) {
    const store = readE2EStore();
    delete store.bouquets[id];
    writeE2EStore(store);
    return;
  }

  const supabase = getSupabaseAdmin();
  await supabase.from("bouquets").delete().eq("id", id);
}

/**
 * Fetches a bouquet for `/b/[id]` and marks `opened_at` on first view.
 * Returns `null` identically for unknown AND `removed` IDs so IDs cannot be probed.
 */
export async function getBouquetForRevealAndMarkOpened(
  id: string
): Promise<BouquetRecord | null> {
  if (isE2EMockMode()) {
    const store = readE2EStore();
    const record = store.bouquets[id];
    if (!record || record.status === "removed") {
      return null;
    }
    if (!record.opened_at) {
      record.opened_at = new Date().toISOString();
      writeE2EStore(store);
    }
    return record;
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("bouquets")
    .select(
      "id, bouquet_json, message, signoff, recipient_name, preview_path, recipient_email_hash, sender_ip_hash, created_at, opened_at, status"
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const record = data as BouquetRecord;
  if (record.status === "removed") {
    return null;
  }

  if (!record.opened_at) {
    const nowIso = new Date().toISOString();
    await supabase
      .from("bouquets")
      .update({ opened_at: nowIso })
      .eq("id", id)
      .is("opened_at", null);
    record.opened_at = nowIso;
  }

  return record;
}

/**
 * Records an abuse report for a bouquet, sets its status to `reported`,
 * and automatically bans the sender's IP hash if >= 3 of their bouquets are reported.
 */
export async function reportBouquetById(input: {
  bouquetId: string;
  reason: string | null;
  reporterIpHash: string;
}): Promise<{ found: boolean }> {
  if (isE2EMockMode()) {
    const store = readE2EStore();
    const target = store.bouquets[input.bouquetId];
    if (!target || target.status === "removed") {
      return { found: false };
    }

    store.reports.push({
      id: `rep_${Date.now()}`,
      bouquet_id: input.bouquetId,
      reason: input.reason,
      reporter_ip_hash: input.reporterIpHash,
      created_at: new Date().toISOString(),
    });
    target.status = "reported";

    const reportedCountForSender = Object.values(store.bouquets).filter(
      (b) => b.sender_ip_hash === target.sender_ip_hash && b.status !== "active"
    ).length;

    if (reportedCountForSender >= AUTO_BAN_REPORTED_BOUQUET_THRESHOLD) {
      store.bannedIps[target.sender_ip_hash] = {
        reason: "Auto-ban: >=3 reported bouquets",
        expiresAt: null,
      };
    }

    writeE2EStore(store);
    return { found: true };
  }

  const supabase = getSupabaseAdmin();
  const { data: bouquet, error: fetchError } = await supabase
    .from("bouquets")
    .select("id, sender_ip_hash, status")
    .eq("id", input.bouquetId)
    .maybeSingle();

  if (fetchError || !bouquet || bouquet.status === "removed") {
    return { found: false };
  }

  const { error: insertReportError } = await supabase.from("reports").insert({
    bouquet_id: input.bouquetId,
    reason: input.reason,
    reporter_ip_hash: input.reporterIpHash,
  });

  if (insertReportError) {
    throw new Error("Failed to insert report.");
  }

  if (bouquet.status === "active") {
    await supabase
      .from("bouquets")
      .update({ status: "reported" })
      .eq("id", input.bouquetId);
  }

  // Deterrence check: count distinct reported/removed bouquets from this sender_ip_hash
  const { count } = await supabase
    .from("bouquets")
    .select("id", { count: "exact", head: true })
    .eq("sender_ip_hash", bouquet.sender_ip_hash as string)
    .in("status", ["reported", "removed"]);

  if ((count ?? 0) >= AUTO_BAN_REPORTED_BOUQUET_THRESHOLD) {
    await supabase.from("banned_ips").upsert(
      {
        ip_hash: bouquet.sender_ip_hash as string,
        reason: "Auto-banned after multiple reported bouquets",
      },
      { onConflict: "ip_hash" }
    );
  }

  return { found: true };
}

/**
 * Deletes bouquets older than `retentionDays` (default 90 days) together with
 * their hosted preview PNG files in Supabase Storage.
 */
export async function cleanupExpiredBouquets(
  retentionDays: number = 90
): Promise<{ deletedBouquets: number; deletedImages: number }> {
  const cutoffIso = new Date(
    Date.now() - retentionDays * 24 * 60 * 60 * 1000
  ).toISOString();

  if (isE2EMockMode()) {
    const store = readE2EStore();
    const expiredIds: string[] = [];
    const expiredImages: string[] = [];

    for (const [id, record] of Object.entries(store.bouquets)) {
      if (record.created_at < cutoffIso) {
        expiredIds.push(id);
        if (record.preview_path) {
          expiredImages.push(record.preview_path);
        }
        delete store.bouquets[id];
      }
    }

    writeE2EStore(store);
    await deletePreviewPngs(expiredImages);
    return {
      deletedBouquets: expiredIds.length,
      deletedImages: expiredImages.length,
    };
  }

  const supabase = getSupabaseAdmin();
  const { data: expiredRows, error: selectError } = await supabase
    .from("bouquets")
    .select("id, preview_path")
    .lt("created_at", cutoffIso)
    .limit(500);

  if (selectError) {
    throw new Error("Failed to query expired bouquets.");
  }

  if (!expiredRows || expiredRows.length === 0) {
    return { deletedBouquets: 0, deletedImages: 0 };
  }

  const ids = expiredRows.map((row) => row.id as string);
  const imagePaths = expiredRows
    .map((row) => row.preview_path as string | null)
    .filter((p): p is string => Boolean(p));

  if (imagePaths.length > 0) {
    await deletePreviewPngs(imagePaths);
  }

  const { error: deleteError } = await supabase.from("bouquets").delete().in("id", ids);

  if (deleteError) {
    throw new Error("Failed to delete expired bouquets.");
  }

  return {
    deletedBouquets: ids.length,
    deletedImages: imagePaths.length,
  };
}
