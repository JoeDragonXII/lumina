import path from "node:path";
import process from "node:process";

import { chromium } from "@playwright/test";
import sharp from "sharp";

const projectRoot = process.cwd();
const baseUrl = process.env.MAP_QA_BASE_URL ?? "http://localhost:3002";
const sourcePath = process.env.MAP_DAYLIGHT_SOURCE;
const implementationPath = path.join(projectRoot, "design-qa-map-daylight.png");
const mobilePath = path.join(projectRoot, "design-qa-map-daylight-mobile.png");
const comparisonPath = path.join(projectRoot, "design-qa-map-daylight-comparison.png");
const controlsComparisonPath = path.join(
  projectRoot,
  "design-qa-map-daylight-controls-comparison.png",
);

if (!sourcePath) {
  throw new Error("MAP_DAYLIGHT_SOURCE is required.");
}

const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.CHROME_PATH || chromium.executablePath(),
});

const context = await browser.newContext({
  viewport: { width: 1440, height: 1024 },
  deviceScaleFactor: 1,
  colorScheme: "light",
  reducedMotion: "reduce",
  locale: "zh-CN",
});

const page = await context.newPage();
const consoleErrors = [];
const pageErrors = [];

page.on("console", (message) => {
  if (message.type() === "error") consoleErrors.push(message.text());
});
page.on("pageerror", (error) => pageErrors.push(error.message));

try {
  await page.goto(`${baseUrl}/map/asia`, { waitUntil: "networkidle" });
  await page.locator(".public-map-page[data-theme='map-daylight']").waitFor();
  await page.locator(".archive-map-shell[data-map-interactive='true']").waitFor();
  await page.evaluate(() => document.fonts.ready);

  const selectedRegion = page.locator(".map-region-pill[aria-current='page']");
  const selectedRegionText = (await selectedRegion.textContent())?.trim();
  if (selectedRegionText !== "亚洲") {
    throw new Error(`Expected 亚洲 to be active, got ${selectedRegionText ?? "nothing"}.`);
  }

  const viewportMetrics = await page.evaluate(() => ({
    width: window.innerWidth,
    height: window.innerHeight,
    scrollWidth: document.documentElement.scrollWidth,
    scrollHeight: document.documentElement.scrollHeight,
  }));
  if (
    viewportMetrics.scrollWidth > viewportMetrics.width ||
    viewportMetrics.scrollHeight > viewportMetrics.height
  ) {
    throw new Error(`Unexpected page overflow: ${JSON.stringify(viewportMetrics)}`);
  }

  for (const selector of [".map-region-dock", ".home-flow-dock", ".map-zoom-controls"]) {
    const bounds = await page.locator(selector).boundingBox();
    if (
      !bounds ||
      bounds.x < 0 ||
      bounds.y < 0 ||
      bounds.x + bounds.width > viewportMetrics.width ||
      bounds.y + bounds.height > viewportMetrics.height
    ) {
      throw new Error(`${selector} is outside the viewport: ${JSON.stringify(bounds)}`);
    }
  }

  await page.screenshot({
    path: implementationPath,
    animations: "disabled",
  });

  const mapShell = page.locator(".archive-map-shell");
  const zoomBefore = Number(await mapShell.getAttribute("data-map-zoom"));
  await page.getByRole("button", { name: "放大地图" }).click();
  const zoomAfter = Number(await mapShell.getAttribute("data-map-zoom"));
  if (!(zoomAfter > zoomBefore)) {
    throw new Error(`Zoom control did not increase zoom: ${zoomBefore} -> ${zoomAfter}`);
  }
  await page.getByRole("button", { name: "重置地图位置" }).click();

  await page.getByRole("link", { name: "欧洲" }).click();
  await page.waitForURL("**/map/europe");
  await page.locator(".public-map-page[data-theme='map-daylight']").waitFor();

  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1,
    colorScheme: "light",
    reducedMotion: "reduce",
    locale: "zh-CN",
  });
  const mobilePage = await mobileContext.newPage();
  mobilePage.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(`[mobile] ${message.text()}`);
  });
  mobilePage.on("pageerror", (error) => pageErrors.push(`[mobile] ${error.message}`));
  await mobilePage.goto(`${baseUrl}/map/asia`, { waitUntil: "networkidle" });
  await mobilePage.locator(".public-map-page[data-theme='map-daylight']").waitFor();
  await mobilePage.locator(".archive-map-shell[data-map-interactive='true']").waitFor();
  await mobilePage.evaluate(() => document.fonts.ready);
  const mobileMetrics = await mobilePage.evaluate(() => ({
    width: window.innerWidth,
    height: window.innerHeight,
    scrollWidth: document.documentElement.scrollWidth,
    scrollHeight: document.documentElement.scrollHeight,
  }));
  await mobilePage.screenshot({ path: mobilePath, animations: "disabled" });
  if (
    mobileMetrics.scrollWidth > mobileMetrics.width ||
    mobileMetrics.scrollHeight > mobileMetrics.height
  ) {
    const overflowCandidates = await mobilePage.evaluate(() =>
      [...document.querySelectorAll("body *")]
        .map((element) => {
          const bounds = element.getBoundingClientRect();
          return {
            tag: element.tagName,
            className: element.getAttribute("class"),
            top: Math.round(bounds.top),
            bottom: Math.round(bounds.bottom),
            height: Math.round(bounds.height),
            position: getComputedStyle(element).position,
          };
        })
        .filter((item) => item.bottom > window.innerHeight + 1 && item.position !== "fixed")
        .slice(0, 20),
    );
    throw new Error(
      `Unexpected mobile overflow: ${JSON.stringify({ mobileMetrics, overflowCandidates })}`,
    );
  }
  const mobileDockBounds = await mobilePage
    .locator("nav[aria-label='全站导航']")
    .filter({ visible: true })
    .boundingBox();
  if (
    !mobileDockBounds ||
    mobileDockBounds.x < 0 ||
    mobileDockBounds.y < 0 ||
    mobileDockBounds.x + mobileDockBounds.width > mobileMetrics.width ||
    mobileDockBounds.y + mobileDockBounds.height > mobileMetrics.height
  ) {
    throw new Error(`Mobile dock is outside the viewport: ${JSON.stringify(mobileDockBounds)}`);
  }
  await mobileContext.close();

  const sourceMetadata = await sharp(sourcePath).metadata();
  const implementationMetadata = await sharp(implementationPath).metadata();
  if (
    sourceMetadata.width !== 1440 ||
    sourceMetadata.height !== 1024 ||
    implementationMetadata.width !== 1440 ||
    implementationMetadata.height !== 1024
  ) {
    throw new Error(
      `Expected 1440x1024 evidence, got source ${sourceMetadata.width}x${sourceMetadata.height} and implementation ${implementationMetadata.width}x${implementationMetadata.height}.`,
    );
  }

  await sharp({
    create: {
      width: 2880,
      height: 1024,
      channels: 4,
      background: "#eef0f7",
    },
  })
    .composite([
      { input: sourcePath, left: 0, top: 0 },
      { input: implementationPath, left: 1440, top: 0 },
    ])
    .png()
    .toFile(comparisonPath);

  const controlsRegion = { left: 300, top: 30, width: 840, height: 140 };
  const [sourceControls, implementationControls] = await Promise.all([
    sharp(sourcePath).extract(controlsRegion).png().toBuffer(),
    sharp(implementationPath).extract(controlsRegion).png().toBuffer(),
  ]);
  await sharp({
    create: {
      width: controlsRegion.width * 2,
      height: controlsRegion.height,
      channels: 4,
      background: "#eef0f7",
    },
  })
    .composite([
      { input: sourceControls, left: 0, top: 0 },
      { input: implementationControls, left: controlsRegion.width, top: 0 },
    ])
    .png()
    .toFile(controlsComparisonPath);

  if (consoleErrors.length > 0 || pageErrors.length > 0) {
    throw new Error(
      `Browser errors detected: ${JSON.stringify({ consoleErrors, pageErrors })}`,
    );
  }

  console.log(
    JSON.stringify(
      {
        browser: process.env.CHROME_PATH || chromium.executablePath(),
        route: "/map/asia",
        viewport: viewportMetrics,
        selectedRegion: selectedRegionText,
        zoom: { before: zoomBefore, after: zoomAfter },
        implementationPath,
        mobilePath,
        comparisonPath,
        controlsComparisonPath,
        consoleErrors,
        pageErrors,
      },
      null,
      2,
    ),
  );
} finally {
  await browser.close();
}
