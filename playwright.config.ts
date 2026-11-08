import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: `npx next dev -p ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: false,
    timeout: 120 * 1000,
    env: {
      NEXT_PUBLIC_APP_URL: BASE_URL,
      NEXT_PUBLIC_TURNSTILE_SITE_KEY: "1x00000000000000000000AA",
      TURNSTILE_SECRET_KEY: "1x0000000000000000000000000000000AA",
      SUPABASE_URL: "https://mock-project.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "e2e-mock-service-role-key-not-used-externally",
      SUPABASE_STORAGE_BUCKET: "bouquet-previews",
      RESEND_API_KEY: "re_mock_e2e_test_key_123456789",
      EMAIL_FROM: "Buket Rahasia <hai@buketrahasia.test>",
      UPSTASH_REDIS_REST_URL: "https://mock-redis.upstash.io",
      UPSTASH_REDIS_REST_TOKEN: "e2e-mock-upstash-token",
      HASH_PEPPER: "e2e-test-pepper-at-least-32-characters-long-secret!!",
      HMAC_SECRET: "e2e-test-hmac-secret-at-least-32-characters-long!!",
      CRON_SECRET: "e2e-test-cron-secret-at-least-24-chars!!",
      E2E_MOCK_SERVICES: "true",
    },
  },
});
