import { expect, test } from "@playwright/test";

test("production map loads MapLibre positioning styles on direct navigation", async ({ page }) => {
  await page.goto("/map");
  const canvas = page.locator(".maplibregl-canvas");
  await expect(canvas).toBeVisible();
  await expect(canvas).toHaveCSS("position", "absolute");
  await expect(page.locator(".maplibregl-ctrl-bottom-right")).toHaveCSS("position", "absolute");
});

test("photo preview merges colliding cards and does not render heat cells", async ({
  page,
}) => {
  await page.goto("/preview/map-legacy?continent=asia");

  const overlay = page.locator("[data-cluster-count]").last();
  const eastAsiaCard = page.getByRole("img", {
    name: "东亚影像，101 张照片",
  });

  await expect(eastAsiaCard).toHaveCount(1);
  await expect(eastAsiaCard).toBeVisible();
  await expect(eastAsiaCard.locator("image")).toHaveAttribute("width", "62");
  await expect(eastAsiaCard.locator("image")).toHaveAttribute("height", "62");
  await expect(page.locator(".map-preview-interactive [data-density]")).toHaveCount(
    0,
  );

  const zoomIn = page.getByRole("button", { name: "放大地图" });
  while (await zoomIn.isEnabled()) {
    await zoomIn.click();
  }

  await expect(eastAsiaCard).toHaveCount(1);
  await expect(eastAsiaCard).toBeVisible();
  await expect(
    page.getByRole("img", { name: /东亚影像，(?:49|52) 张照片/ }),
  ).toHaveCount(0);
  await expect(overlay).toHaveAttribute("data-cell-degrees", "3");

  await page.screenshot({
    path: "test-results/map-preview-asia-max-zoom.png",
    fullPage: true,
  });
});

test("printed map preview loads postcard clusters and keeps selection visible", async ({
  page,
}) => {
  const browserErrors: string[] = [];
  page.on("pageerror", (error) => browserErrors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") browserErrors.push(message.text());
  });
  page.on("requestfailed", (request) => {
    if (request.failure()?.errorText === "net::ERR_ABORTED") return;
    browserErrors.push(
      `Request failed: ${request.url()} (${request.failure()?.errorText ?? "unknown"})`,
    );
  });

  await page.goto("/preview/map1");
  expect(
    await page.evaluate(
      () => document.createElement("canvas").getContext("webgl2") !== null,
    ),
  ).toBe(true);

  const map = page.getByRole("application", {
    name: "手绘印刷风格摄影地图，可拖动和缩放",
  });
  const postcardMarkers = page.getByRole("button", { name: /张照片/ });

  await expect(map).toBeVisible();
  await expect(postcardMarkers.first()).toBeVisible({ timeout: 20_000 });
  expect(await postcardMarkers.count()).toBeGreaterThan(2);
  await expect(page.getByText("OpenFreeMap", { exact: true })).toBeVisible();
  await expect(page.getByRole("status")).toHaveCount(0, { timeout: 30_000 });
  await expect
    .poll(async () =>
      Number((await map.getAttribute("data-rendered-features")) ?? "0"),
    )
    .toBeGreaterThan(0);
  await page.waitForTimeout(2_500);

  await page.screenshot({
    path: "test-results/map1-printed-postcards.png",
    fullPage: true,
  });

  const clusterPassesBeforeZoom = Number(
    (await map.getAttribute("data-cluster-passes")) ?? "0",
  );
  await postcardMarkers.first().click();
  await expect
    .poll(
      async () =>
        Number((await map.getAttribute("data-cluster-passes")) ?? "0"),
      { intervals: [16, 32, 64, 128], timeout: 1_500 },
    )
    .toBeGreaterThan(clusterPassesBeforeZoom);
  await expect(page.getByLabel("选中的照片图集")).toBeVisible();

  expect(browserErrors).toEqual([]);
});

test("printed map keeps photo clusters hidden until the base map renders", async ({
  page,
}) => {
  let releaseStyle!: () => void;
  const styleGate = new Promise<void>((resolve) => {
    releaseStyle = resolve;
  });

  await page.route("**/api/openfreemap/styles/positron", async (route) => {
    await styleGate;
    await route.continue();
  });

  await page.goto("/preview/map1", { waitUntil: "domcontentloaded" });

  await expect(page.getByRole("status")).toBeVisible();
  await expect(page.locator("button[data-cluster-members]")).toHaveCount(0);

  releaseStyle();

  await expect(page.locator("button[data-cluster-members]").first()).toBeVisible({
    timeout: 20_000,
  });
  await expect(page.getByRole("status")).toHaveCount(0);
});
