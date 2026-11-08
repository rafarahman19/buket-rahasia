import fs from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";

interface MockCapturedEmail {
  to: string;
  subject: string;
  revealUrl: string;
  reportUrl: string;
  blockPageUrl: string;
  headers: Record<string, string>;
  html: string;
  text: string;
}

test("smoke flow: build bouquet -> submit (mocked email provider) -> open reveal page", async ({
  page,
}) => {
  const outboxFile = path.join(process.cwd(), ".e2e-outbox", "latest-email.json");
  if (fs.existsSync(outboxFile)) {
    fs.unlinkSync(outboxFile);
  }

  // 1. Landing page in Bahasa Indonesia
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /Sampaikan lewat seikat bunga/i })
  ).toBeVisible();

  await page.getByTestId("hero-start-btn").click();
  await expect(page).toHaveURL(/\/rakit$/);

  // 2. Build bouquet: add extra flowers & customize paper/ribbon
  await expect(page.getByTestId("add-element-sunflower")).toBeVisible();
  await page.getByTestId("add-element-sunflower").click();
  await page.getByTestId("add-element-lavender").click();

  await page.getByRole("tab", { name: "Kertas" }).click();
  await page.getByTestId("select-paper-sage_green").click();

  await page.getByRole("tab", { name: "Pita" }).click();
  await page.getByTestId("select-ribbon-velvet_burgundy").click();

  // Proceed to send step
  await page.getByTestId("proceed-to-send-btn").click();

  // 3. Fill anonymous send form
  const secretMessage =
    "Terima kasih sudah selalu sabar dan hangat setiap hari. Semoga harimu penuh senyum!";
  const secretSignoff = "dari pengagum rahasia di lantai dua";

  await page.getByLabel(/Email Penerima/i).fill("nabila.putri@contoh-kampus.ac.id");
  await page.getByLabel(/Nama Panggilan Penerima/i).fill("Nabila");
  await page.getByLabel(/Pesan Rahasia/i).fill(secretMessage);
  await page.getByLabel(/Salam Penutup/i).fill(secretSignoff);

  // Wait deterministically for Turnstile verification to complete, then submit
  await expect(page.getByTestId("turnstile-widget")).toHaveAttribute(
    "data-verified",
    "true",
    { timeout: 10_000 }
  );
  await page.getByTestId("submit-bouquet-btn").click();

  // 4. Verify Confirmation Page (/terkirim) has NO link leaking recipient data
  await expect(page).toHaveURL(/\/terkirim$/, { timeout: 20_000 });
  await expect(page.getByTestId("confirmation-heading")).toHaveText(
    "Buketmu sudah terkirim 🌸"
  );
  const confirmationContent = await page.content();
  expect(confirmationContent).not.toContain("nabila.putri@contoh-kampus.ac.id");
  expect(confirmationContent).not.toContain("/b/");

  // 5. Inspect email captured by mocked email provider
  expect(fs.existsSync(outboxFile)).toBe(true);
  const capturedEmail = JSON.parse(
    fs.readFileSync(outboxFile, "utf8")
  ) as MockCapturedEmail;

  expect(capturedEmail.to).toBe("nabila.putri@contoh-kampus.ac.id");
  expect(capturedEmail.subject).toBe("Ada yang diam-diam ngirim bunga buat kamu 🌸");
  expect(capturedEmail.headers["List-Unsubscribe"]).toContain("/api/block?token=");

  // Email teaser MUST NOT leak the secret message
  expect(capturedEmail.html).not.toContain(secretMessage);
  expect(capturedEmail.text).not.toContain(secretMessage);

  const revealPath = new URL(capturedEmail.revealUrl).pathname;
  expect(revealPath).toMatch(/^\/b\/[A-Za-z0-9_-]{21,}$/);

  // 6. Open Reveal Page (/b/[id]) and verify bouquet + secret message + safety links
  const revealResponse = await page.goto(revealPath);
  expect(revealResponse?.status()).toBe(200);
  expect(revealResponse?.headers()["x-robots-tag"]).toContain("noindex");

  await expect(page.getByTestId("reveal-secret-message")).toHaveText(secretMessage);
  await expect(page.getByTestId("reveal-signoff")).toContainText(secretSignoff);
  await expect(
    page.getByRole("link", { name: /Buat buket untuk orang lain/i })
  ).toBeVisible();
  await expect(page.getByTestId("open-report-btn")).toBeVisible();
  await expect(page.getByTestId("block-email-link")).toBeVisible();

  // 7. Unknown ID returns 404
  const unknownRes = await page.goto("/b/tidak_ada_buket_dengan_id_ini_12345");
  expect(unknownRes?.status()).toBe(404);
});
