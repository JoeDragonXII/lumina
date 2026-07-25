import path from "node:path";
import process from "node:process";

import { chromium } from "@playwright/test";

const projectRoot = process.cwd();
const baseUrl = process.env.MAP_QA_BASE_URL ?? "http://localhost:3002";
const desktopPath = path.join(projectRoot, "map-night-gold-demo.png");
const mobilePath = path.join(projectRoot, "map-night-gold-demo-mobile.png");
const browserErrors = [];

const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.CHROME_PATH || chromium.executablePath(),
});

async function capture(viewport, outputPath) {
  const context = await browser.newContext({
    viewport,
    deviceScaleFactor: 1,
    colorScheme: "dark",
    reducedMotion: "reduce",
    locale: "zh-CN",
  });
  const page = await context.newPage();
  page.on("console", (message) => {
    if (message.type() === "error") browserErrors.push(message.text());
  });
  page.on("pageerror", (error) => browserErrors.push(error.message));

  await page.goto(`${baseUrl}/map/asia?theme=night-gold`, {
    waitUntil: "networkidle",
  });
  await page.locator(".public-map-page[data-theme='map-night-gold']").waitFor();
  await page.locator(".archive-map-shell[data-map-interactive='true']").waitFor();
  await page.evaluate(() => document.fonts.ready);

  const metrics = await page.evaluate(() => ({
    width: window.innerWidth,
    height: window.innerHeight,
    scrollWidth: document.documentElement.scrollWidth,
    scrollHeight: document.documentElement.scrollHeight,
  }));
  if (
    metrics.scrollWidth > metrics.width ||
    metrics.scrollHeight > metrics.height
  ) {
    throw new Error(`Unexpected overflow: ${JSON.stringify(metrics)}`);
  }

  await page.screenshot({ path: outputPath, animations: "disabled" });

  if (viewport.width >= 768) {
    const mapShell = page.locator(".archive-map-shell");
    const zoomBefore = Number(await mapShell.getAttribute("data-map-zoom"));
    await page.getByRole("button", { name: "放大地图" }).click();
    const zoomAfter = Number(await mapShell.getAttribute("data-map-zoom"));
    if (!(zoomAfter > zoomBefore)) throw new Error("Zoom control did not respond.");
    await page.getByRole("button", { name: "重置地图位置" }).click();
    await page.getByRole("link", { name: "欧洲" }).click();
    await page.waitForURL("**/map/europe?theme=night-gold");
  }

  await context.close();
  return metrics;
}

try {
  const desktop = await capture({ width: 1440, height: 1024 }, desktopPath);
  const mobile = await capture({ width: 390, height: 844 }, mobilePath);
  if (browserErrors.length > 0) {
    throw new Error(`Browser errors: ${JSON.stringify(browserErrors)}`);
  }
  console.log(
    JSON.stringify(
      {
        route: "/map/asia?theme=night-gold",
        desktop,
        mobile,
        desktopPath,
        mobilePath,
        browserErrors,
      },
      null,
      2,
    ),
  );
} finally {
  await browser.close();
}
