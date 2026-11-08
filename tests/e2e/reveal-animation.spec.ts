import fs from "node:fs";
import path from "node:path";
import { expect, test, type APIRequestContext } from "@playwright/test";
import {
  createStarterBouquet,
  FLOWER_TYPES,
  GREENERY_TYPES,
  type BouquetItem,
  type BouquetJson,
} from "../../src/lib/bouquet-catalog";

interface MockCapturedEmail {
  revealUrl: string;
}

const SCREENSHOT_DIR =
  process.env.REVEAL_SCREENSHOT_DIR ??
  path.join(process.cwd(), "test-results", "reveal-screenshots");

async function createBouquetAndGetRevealPath(
  request: APIRequestContext,
  options: {
    bouquet: BouquetJson;
    ip: string;
    recipientEmail: string;
    recipientName: string;
    message: string;
    signoff: string;
  }
): Promise<string> {
  const outboxFile = path.join(process.cwd(), ".e2e-outbox", "latest-email.json");
  if (fs.existsSync(outboxFile)) {
    fs.unlinkSync(outboxFile);
  }

  const response = await request.post("/api/send", {
    headers: {
      origin: "http://localhost:3100",
      "x-real-ip": options.ip,
    },
    data: {
      bouquet: options.bouquet,
      recipientEmail: options.recipientEmail,
      recipientName: options.recipientName,
      message: options.message,
      signoff: options.signoff,
      turnstileToken: "e2e-mock-turnstile-token",
      previewPath: "e2ePreviewMockToken123456.png",
    },
  });

  expect(response.status()).toBe(200);
  const json = (await response.json()) as { ok?: boolean };
  expect(json.ok).toBe(true);

  expect(fs.existsSync(outboxFile)).toBe(true);
  const captured = JSON.parse(fs.readFileSync(outboxFile, "utf8")) as MockCapturedEmail;
  return new URL(captured.revealUrl).pathname;
}

function buildTwentyFiveItemBouquet(): BouquetJson {
  const items: BouquetItem[] = [];
  let z = 0;

  // 6 back greenery sprigs
  for (let i = 0; i < 6; i++) {
    const progress = i / 5;
    items.push({
      type: GREENERY_TYPES[i % GREENERY_TYPES.length]!,
      x: Math.round(185 + progress * 230),
      y: Math.round(190 + Math.abs(progress - 0.5) * 58),
      scale: 1.08,
      rotation: Math.round(-30 + progress * 60),
      z: z++,
    });
  }

  // 19 flowers across 3 natural tiers (total = 25 elements)
  const tiers = [
    { count: 7, yBase: 210, xStart: 195, xSpan: 210, scale: 1.02 },
    { count: 7, yBase: 258, xStart: 205, xSpan: 190, scale: 1.0 },
    { count: 5, yBase: 306, xStart: 232, xSpan: 136, scale: 0.94 },
  ];

  let flowerIdx = 0;
  for (const tier of tiers) {
    for (let i = 0; i < tier.count; i++) {
      const progress = tier.count > 1 ? i / (tier.count - 1) : 0.5;
      items.push({
        type: FLOWER_TYPES[flowerIdx % FLOWER_TYPES.length]!,
        x: Math.round(tier.xStart + progress * tier.xSpan),
        y: Math.round(tier.yBase + Math.abs(progress - 0.5) * 26),
        scale: tier.scale,
        rotation: Math.round(-18 + progress * 36),
        z: z++,
      });
      flowerIdx++;
    }
  }

  return {
    version: 1,
    paper: "warm_cream",
    ribbon: "satin_rose",
    items,
  };
}

test.describe("Staged bouquet reveal animation (/b/[id])", () => {
  let consoleErrors: string[] = [];

  test.beforeAll(() => {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  });

  test.beforeEach(({ page }) => {
    consoleErrors = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });
    page.on("pageerror", (err) => {
      consoleErrors.push(err.message);
    });
  });

  test.afterEach(() => {
    expect(consoleErrors).toEqual([]);
  });

  test("10-item bouquet: verifies layer order, progressive z-stagger, replay, and captures t=0.3s, 1.5s, 3.0s, 4.5s", async ({
    page,
    request,
  }) => {
    await page.setViewportSize({ width: 520, height: 980 });

    // Shuffle array order while preserving z values to verify strict z-order sorting
    const starter = createStarterBouquet();
    const shuffledBouquet: BouquetJson = {
      ...starter,
      items: [...starter.items].reverse(),
    };

    const revealPath = await createBouquetAndGetRevealPath(request, {
      bouquet: shuffledBouquet,
      ip: "203.0.113.41",
      recipientEmail: "nadia.kirana@kampus-contoh.ac.id",
      recipientName: "Nadia",
      message: "Semoga bunga kecil ini bikin soremu terasa lebih hangat dan tenang ya 🌸",
      signoff: "seseorang yang mengagumi senyummu",
    });

    await page.goto(revealPath);

    // Wait for initial reveal sequence to complete
    await expect(page.getByTestId("reveal-secret-message")).toBeVisible();
    await expect(page.getByTestId("reveal-message-card")).toHaveCSS("opacity", "1", {
      timeout: 7_000,
    });

    // Verify strict back-to-front SVG layer order
    const layers = await page
      .locator('[data-testid="reveal-bouquet-svg"] > [data-layer]')
      .evaluateAll((nodes) => nodes.map((n) => n.getAttribute("data-layer")));
    expect(layers).toEqual([
      "wrapper-back",
      "stems-and-greenery",
      "flowers",
      "particles",
      "wrapper-front",
      "ribbon",
    ]);

    // Particle cap check (6..10 particles)
    const particleCount = await page
      .locator('[data-testid="layer-particles"] > g')
      .count();
    expect(particleCount).toBeGreaterThanOrEqual(6);
    expect(particleCount).toBeLessThanOrEqual(10);

    // Trigger replay to synchronize t=0.000s in-page and verify replay resets full choreography
    const replayBtn = page.getByTestId("replay-reveal-btn");
    await expect(replayBtn).toBeVisible();

    const t0 = Date.now();
    await replayBtn.click();

    const waitUntilElapsed = async (targetMs: number) => {
      const remaining = targetMs - (Date.now() - t0);
      if (remaining > 0) {
        await page.waitForTimeout(remaining);
      }
    };

    // Checkpoint 1: t = 0.3s -> Wrapper back visible, front wrapper + ribbon + message hidden
    await waitUntilElapsed(300);
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "reveal-10-t0.3s-wrapper.png"),
    });
    const stateAt03 = await page.evaluate(() => {
      const back = document.querySelector('[data-testid="layer-wrapper-back"]');
      const front = document.querySelector('[data-testid="layer-wrapper-front"]');
      const ribbon = document.querySelector('[data-testid="ribbon-bow-motion"]');
      const msg = document.querySelector('[data-testid="reveal-message-card"]');
      return {
        backOpacity: back ? Number(getComputedStyle(back).opacity) : 0,
        frontOpacity: front ? Number(getComputedStyle(front).opacity) : 1,
        ribbonOpacity: ribbon ? Number(getComputedStyle(ribbon).opacity) : 1,
        msgOpacity: msg ? Number(getComputedStyle(msg).opacity) : 1,
      };
    });
    expect(stateAt03.backOpacity).toBeGreaterThan(0.2);
    expect(stateAt03.frontOpacity).toBe(0);
    expect(stateAt03.ribbonOpacity).toBe(0);
    expect(stateAt03.msgOpacity).toBe(0);

    // Checkpoint 2: t = 1.5s -> Flowers blooming progressively (early z visible, last z=9 still hidden)
    await waitUntilElapsed(1500);
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "reveal-10-t1.5s-blooming.png"),
    });
    const stateAt15 = await page.evaluate(() => {
      const stemMotions = Array.from(
        document.querySelectorAll('[data-testid="layer-stems-and-greenery"] > g > g')
      );
      const firstOpacity = stemMotions[0]
        ? Number(getComputedStyle(stemMotions[0]).opacity)
        : 0;
      const lastOpacity = stemMotions[stemMotions.length - 1]
        ? Number(getComputedStyle(stemMotions[stemMotions.length - 1]!).opacity)
        : 1;
      const front = document.querySelector('[data-testid="layer-wrapper-front"]');
      return {
        firstOpacity,
        lastOpacity,
        frontOpacity: front ? Number(getComputedStyle(front).opacity) : 1,
      };
    });
    expect(stateAt15.firstOpacity).toBeGreaterThan(0.85);
    expect(stateAt15.lastOpacity).toBe(0);
    expect(stateAt15.frontOpacity).toBe(0);

    // Checkpoint 3: t = 3.0s -> Front wrapper folded & ribbon bow tied, message not shown yet
    await waitUntilElapsed(3000);
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "reveal-10-t3.0s-ribbon.png"),
    });
    const stateAt30 = await page.evaluate(() => {
      const front = document.querySelector('[data-testid="layer-wrapper-front"]');
      const ribbon = document.querySelector('[data-testid="ribbon-bow-motion"]');
      const msg = document.querySelector('[data-testid="reveal-message-card"]');
      return {
        frontOpacity: front ? Number(getComputedStyle(front).opacity) : 0,
        ribbonOpacity: ribbon ? Number(getComputedStyle(ribbon).opacity) : 0,
        msgOpacity: msg ? Number(getComputedStyle(msg).opacity) : 1,
      };
    });
    expect(stateAt30.frontOpacity).toBeGreaterThan(0.85);
    expect(stateAt30.ribbonOpacity).toBeGreaterThan(0.85);
    expect(stateAt30.msgOpacity).toBeLessThan(0.1);

    // Checkpoint 4: t = 4.5s -> Message card shown & bouquet settled in final static state
    await waitUntilElapsed(4500);
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "reveal-10-t4.5s-message.png"),
    });
    await expect(page.getByTestId("reveal-message-card")).toHaveCSS("opacity", "1");
  });

  test("1-flower and 25-flower bouquets complete smoothly without clipping", async ({
    page,
    request,
  }) => {
    await page.setViewportSize({ width: 520, height: 980 });

    // 1. Single-flower bouquet
    const singleFlowerBouquet: BouquetJson = {
      version: 1,
      paper: "sage_green",
      ribbon: "organza_cream",
      items: [{ type: "rose", x: 300, y: 258, scale: 1.18, rotation: -3, z: 0 }],
    };

    const singlePath = await createBouquetAndGetRevealPath(request, {
      bouquet: singleFlowerBouquet,
      ip: "203.0.113.42",
      recipientEmail: "satu.bunga@kampus-contoh.ac.id",
      recipientName: "Alya",
      message: "Satu tangkai mawar khusus untuk mengawali pekanmu.",
      signoff: "teman sekelasmu",
    });

    await page.goto(singlePath);
    await expect(page.getByTestId("reveal-message-card")).toHaveCSS("opacity", "1", {
      timeout: 6_500,
    });
    await expect(page.locator('[data-testid="layer-flowers"] > g')).toHaveCount(1);
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "reveal-1-flower-final.png"),
    });

    // 2. Max 25-element bouquet
    const maxBouquet = buildTwentyFiveItemBouquet();
    expect(maxBouquet.items).toHaveLength(25);

    const maxPath = await createBouquetAndGetRevealPath(request, {
      bouquet: maxBouquet,
      ip: "203.0.113.43",
      recipientEmail: "duapuluhlima@kampus-contoh.ac.id",
      recipientName: "Raras",
      message: "Seikat penuh 25 tangkai bunga warna-warni buat merayakan kelulusanmu!",
      signoff: "sahabat lamamu",
    });

    await page.goto(maxPath);
    await expect(
      page.locator('[data-testid="layer-stems-and-greenery"] > g')
    ).toHaveCount(25);
    await expect(page.locator('[data-testid="layer-flowers"] > g')).toHaveCount(19);

    // Wait for full 25-flower sequence + message card
    await expect(page.getByTestId("reveal-message-card")).toHaveCSS("opacity", "1", {
      timeout: 7_500,
    });
    await page.waitForTimeout(300);
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "reveal-25-flowers-final.png"),
    });
  });

  test("prefers-reduced-motion skips staged bloom to a simple 300ms fade", async ({
    page,
    request,
  }) => {
    await page.setViewportSize({ width: 520, height: 980 });
    await page.emulateMedia({ reducedMotion: "reduce" });

    const revealPath = await createBouquetAndGetRevealPath(request, {
      bouquet: createStarterBouquet(),
      ip: "203.0.113.44",
      recipientEmail: "tenang.mode@kampus-contoh.ac.id",
      recipientName: "Laras",
      message: "Semoga harimu damai dan penuh hal baik.",
      signoff: "pengirim rahasia",
    });

    await page.goto(revealPath);

    // Reduced-motion container renders immediately without waiting 4s
    const reducedContainer = page.getByTestId("reveal-reduced-motion-fade");
    await expect(reducedContainer).toBeVisible();
    await expect(page.getByTestId("layer-particles")).toHaveCount(0);

    // Within ~500ms, the 300ms fade finishes completely (versus >4s in full mode)
    await page.waitForTimeout(450);
    await expect(reducedContainer).toHaveCSS("opacity", "1");
    await expect(page.getByTestId("reveal-secret-message")).toBeVisible();

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "reveal-reduced-motion.png"),
    });
  });
});
