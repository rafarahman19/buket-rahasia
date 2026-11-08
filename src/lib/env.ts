import "server-only";
import { z } from "zod";

const serverEnvSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    VERCEL_ENV: z.string().optional(),
    NEXT_PUBLIC_APP_URL: z
      .string({ required_error: "NEXT_PUBLIC_APP_URL is required" })
      .url("NEXT_PUBLIC_APP_URL must be a valid URL"),
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: z
      .string({ required_error: "NEXT_PUBLIC_TURNSTILE_SITE_KEY is required" })
      .min(1, "NEXT_PUBLIC_TURNSTILE_SITE_KEY cannot be empty"),
    TURNSTILE_SECRET_KEY: z
      .string({ required_error: "TURNSTILE_SECRET_KEY is required" })
      .min(1, "TURNSTILE_SECRET_KEY cannot be empty"),
    SUPABASE_URL: z
      .string({ required_error: "SUPABASE_URL is required" })
      .url("SUPABASE_URL must be a valid HTTPS URL"),
    SUPABASE_SERVICE_ROLE_KEY: z
      .string({ required_error: "SUPABASE_SERVICE_ROLE_KEY is required" })
      .min(20, "SUPABASE_SERVICE_ROLE_KEY appears invalid"),
    SUPABASE_STORAGE_BUCKET: z.string().min(1).default("bouquet-previews"),
    RESEND_API_KEY: z
      .string({ required_error: "RESEND_API_KEY is required" })
      .min(10, "RESEND_API_KEY appears invalid"),
    EMAIL_FROM: z
      .string({ required_error: "EMAIL_FROM is required" })
      .min(5, "EMAIL_FROM must be configured (e.g. Buket Rahasia <hai@domain.com>)")
      .refine((v) => !/[\r\n]/.test(v), "EMAIL_FROM must not contain newlines"),
    UPSTASH_REDIS_REST_URL: z
      .string({ required_error: "UPSTASH_REDIS_REST_URL is required" })
      .url("UPSTASH_REDIS_REST_URL must be a valid URL"),
    UPSTASH_REDIS_REST_TOKEN: z
      .string({ required_error: "UPSTASH_REDIS_REST_TOKEN is required" })
      .min(10, "UPSTASH_REDIS_REST_TOKEN appears invalid"),
    HASH_PEPPER: z
      .string({ required_error: "HASH_PEPPER is required" })
      .min(32, "HASH_PEPPER must be at least 32 characters for rainbow-table resistance"),
    HMAC_SECRET: z
      .string({ required_error: "HMAC_SECRET is required" })
      .min(32, "HMAC_SECRET must be at least 32 characters"),
    CRON_SECRET: z
      .string({ required_error: "CRON_SECRET is required" })
      .min(24, "CRON_SECRET must be at least 24 characters"),
    E2E_MOCK_SERVICES: z.enum(["true", "false"]).optional(),
  })
  .superRefine((env, ctx) => {
    if (env.VERCEL_ENV === "production" && env.E2E_MOCK_SERVICES === "true") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["E2E_MOCK_SERVICES"],
        message: "E2E_MOCK_SERVICES must never be enabled in Vercel production.",
      });
    }
  });

export type ServerEnv = z.infer<typeof serverEnvSchema>;

let cachedEnv: ServerEnv | null = null;

export function getServerEnv(): ServerEnv {
  if (cachedEnv) {
    return cachedEnv;
  }

  const parsed = serverEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const formatted = parsed.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    throw new Error(
      `[Buket Rahasia] Invalid or missing server environment variables:\n${formatted}\n` +
        "Copy .env.example to .env.local and fill in all required secrets."
    );
  }

  cachedEnv = parsed.data;
  return cachedEnv;
}

export function isE2EMockMode(): boolean {
  const env = getServerEnv();
  return env.E2E_MOCK_SERVICES === "true" && env.VERCEL_ENV !== "production";
}
