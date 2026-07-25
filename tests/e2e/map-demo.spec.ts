import { expect, test } from "@playwright/test";

test("cyber map keeps the core filters and controls interactive", async ({ page }) => {
  const browserErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") browserErrors.push(message.text());
  });
  page.on("pageerror", (error) => browserErrors.push(error.message));

  await page.goto("/map");

  const map = page.getByLabel("世界摄影足迹地图");
  await expect(map).toBeVisible();

  const asiaFilter = page.getByRole("link", { name: "亚洲" });
  const allFilter = page.getByRole("link", { name: "全部" });
  await expect(allFilter).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".map-sphere")).toHaveCount(0);
  await expect(page.locator(".map-grid-layer")).toHaveAttribute("data-grid-size", "10");
  await expect(page.locator(".map-grid-layer")).toHaveAttribute(
    "data-grid-sample-axis",
    "7",
  );
  await expect(
    page.getByLabel("地图样式切换").getByRole("link", { name: "方格" }),
  ).toHaveAttribute(
    "aria-current",
    "page",
  );
  const worldCountryCount = await page.locator(".world-country-path").count();

  await asiaFilter.click();
  await expect(page).toHaveURL(/\/map\/asia$/);
  await page.waitForLoadState("networkidle");
  await expect(page.getByLabel("亚洲摄影足迹地图")).toBeVisible();
  await expect(asiaFilter).toHaveAttribute("aria-pressed", "true");
  expect(await page.locator(".world-country-path").count()).toBeLessThan(worldCountryCount);

  const hoverRegion = page
    .locator(".world-country-path.is-region-active:not(.is-focus)")
    .first();
  const hoverCode = await hoverRegion.getAttribute("data-country-code");
  if (!hoverCode) throw new Error("Hover country code is unavailable");
  const hoverGrid = page.locator(
    `.map-grid-country[data-country-code="${hoverCode}"]`,
  );
  const fillBeforeHover = await hoverGrid.evaluate(
    (element) => getComputedStyle(element).fill,
  );
  await hoverRegion.hover();
  await expect
    .poll(() => hoverGrid.evaluate((element) => getComputedStyle(element).fill))
    .not.toBe(fillBeforeHover);
  await expect
    .poll(() => hoverGrid.evaluate((element) => getComputedStyle(element).filter))
    .toContain("drop-shadow");

  const zoomLayer = page.locator(".map-zoom-layer");
  await expect(page.getByLabel("亚洲摄影足迹地图")).toHaveAttribute(
    "viewBox",
    "0 0 1280 720",
  );
  const initialTransform = await zoomLayer.getAttribute("transform");
  await page.getByRole("button", { name: "放大地图" }).click();
  await expect(zoomLayer).not.toHaveAttribute("transform", initialTransform ?? "");

  await page.getByRole("button", { name: "重置地图位置" }).click();
  await expect(zoomLayer).toHaveAttribute("transform", initialTransform ?? "");

  await page.waitForTimeout(400);
  const anchorMarker = page.locator(".map-location-marker.is-primary .map-marker-core");
  const markerBeforeZoom = await anchorMarker.boundingBox();
  if (!markerBeforeZoom) throw new Error("Zoom anchor marker is unavailable");
  const anchorX = markerBeforeZoom.x + markerBeforeZoom.width / 2;
  const anchorY = markerBeforeZoom.y + markerBeforeZoom.height / 2;
  await page.mouse.move(anchorX, anchorY);
  await page.mouse.wheel(0, -260);
  await page.waitForTimeout(400);
  const markerAfterZoom = await anchorMarker.boundingBox();
  if (!markerAfterZoom) throw new Error("Zoomed anchor marker is unavailable");
  expect(Math.abs(markerAfterZoom.x + markerAfterZoom.width / 2 - anchorX)).toBeLessThan(2);
  expect(Math.abs(markerAfterZoom.y + markerAfterZoom.height / 2 - anchorY)).toBeLessThan(2);

  await page.getByRole("button", { name: "重置地图位置" }).click();
  await expect(zoomLayer).toHaveAttribute("transform", initialTransform ?? "");

  const mapBox = await page.getByLabel("亚洲摄影足迹地图").boundingBox();
  if (!mapBox) throw new Error("Map bounds are unavailable");
  await page.mouse.move(mapBox.x + mapBox.width * 0.55, mapBox.y + mapBox.height * 0.62);
  await page.mouse.down();
  await page.mouse.move(mapBox.x + mapBox.width * 0.65, mapBox.y + mapBox.height * 0.68, {
    steps: 4,
  });
  await page.mouse.up();
  await expect(zoomLayer).not.toHaveAttribute("transform", initialTransform ?? "");
  await expect(page).toHaveURL(/\/map\/asia$/);

  await page.getByRole("button", { name: "重置地图位置" }).click();
  await expect(zoomLayer).toHaveAttribute("transform", initialTransform ?? "");
  expect(browserErrors).toEqual([]);
});

test("each continent has its own flat map scene", async ({ page }) => {
  const scenes = [
    { path: "/map?view=flat", key: "all", label: "世界摄影足迹地图" },
    { path: "/map/asia", key: "asia", label: "亚洲摄影足迹地图" },
    { path: "/map/europe", key: "europe", label: "欧洲摄影足迹地图" },
    { path: "/map/africa", key: "africa", label: "非洲摄影足迹地图" },
    { path: "/map/north-america", key: "north-america", label: "北美洲摄影足迹地图" },
    { path: "/map/south-america", key: "south-america", label: "南美洲摄影足迹地图" },
    { path: "/map/oceania", key: "oceania", label: "大洋洲摄影足迹地图" },
  ];

  for (const scene of scenes) {
    await page.goto(scene.path);
    await expect(page.locator(".public-map-page")).toHaveAttribute("data-map-scene", scene.key);
    await expect(page.getByLabel(scene.label)).toBeVisible();
    expect(await page.locator(".world-country-path").count()).toBeGreaterThan(0);
    expect(await page.locator(".map-grid-country").count()).toBeGreaterThan(0);
    await expect(page.locator(".map-sphere")).toHaveCount(0);
  }
});

test("flat grid is the default and globe remains limited to all view", async ({
  page,
}) => {
  const browserErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") browserErrors.push(message.text());
  });
  page.on("pageerror", (error) => browserErrors.push(error.message));

  await page.goto("/map?view=globe");

  const pageShell = page.locator(".public-map-page");
  await expect(pageShell).toHaveAttribute("data-map-mode", "globe");
  await expect(page.getByRole("link", { name: "地球" })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await expect(page.locator(".map-sphere")).toHaveCount(1);
  await expect(page.locator(".map-globe-graticule")).toHaveCount(1);
  await expect(page.locator(".map-region-selection")).toHaveCount(1);

  const regionDock = page.getByRole("navigation", { name: "地图区域筛选" });
  const regionDockBeforeHover = await regionDock.boundingBox();
  if (!regionDockBeforeHover) throw new Error("Region dock is unavailable");
  const regionDockItem = page.locator(".map-region-item-shell").first();
  const regionItemBeforeHover = await regionDockItem.boundingBox();
  if (!regionItemBeforeHover) throw new Error("Region dock item is unavailable");
  await page.mouse.move(
    regionItemBeforeHover.x + regionItemBeforeHover.width / 2,
    regionItemBeforeHover.y + regionItemBeforeHover.height / 2,
  );
  await expect
    .poll(async () => (await regionDockItem.boundingBox())?.width ?? 0)
    .toBeGreaterThan(regionItemBeforeHover.width + 8);
  await expect
    .poll(async () => (await regionDock.boundingBox())?.width ?? 0)
    .toBeGreaterThan(regionDockBeforeHover.width + 12);
  await expect
    .poll(async () => (await regionDock.boundingBox())?.height ?? 0)
    .toBeGreaterThan(regionDockBeforeHover.height + 6);
  const regionDockAfterHover = await regionDock.boundingBox();
  const regionItemAfterHover = await regionDockItem.boundingBox();
  if (!regionDockAfterHover || !regionItemAfterHover) {
    throw new Error("Expanded region dock geometry is unavailable");
  }
  expect(
    Math.abs(
      regionDockAfterHover.y +
        regionDockAfterHover.height / 2 -
        (regionItemAfterHover.y + regionItemAfterHover.height / 2),
    ),
  ).toBeLessThan(1);
  expect(
    Math.abs(
      regionDockAfterHover.x +
        regionDockAfterHover.width / 2 -
        page.viewportSize()!.width / 2,
    ),
  ).toBeLessThan(1);

  const viewDock = page.getByRole("navigation", { name: "地图显示模式" });
  const viewDockBeforeHover = await viewDock.boundingBox();
  if (!viewDockBeforeHover) throw new Error("View dock is unavailable");
  const viewDockItem = page.locator(".map-view-item-shell").last();
  const viewItemBeforeHover = await viewDockItem.boundingBox();
  if (!viewItemBeforeHover) throw new Error("View dock item is unavailable");
  await page.mouse.move(
    viewItemBeforeHover.x + viewItemBeforeHover.width / 2,
    viewItemBeforeHover.y + viewItemBeforeHover.height / 2,
  );
  await expect
    .poll(async () => (await viewDockItem.boundingBox())?.width ?? 0)
    .toBeGreaterThan(viewItemBeforeHover.width + 6);
  await expect
    .poll(async () => (await viewDock.boundingBox())?.width ?? 0)
    .toBeGreaterThan(viewDockBeforeHover.width + 8);
  await expect
    .poll(async () => (await viewDock.boundingBox())?.height ?? 0)
    .toBeGreaterThan(viewDockBeforeHover.height + 5);

  const mapShell = page.locator('.archive-map-shell[data-map-mode="globe"]');
  await expect(mapShell).toHaveAttribute("data-map-zoom", "2.35");
  await expect(mapShell).toHaveAttribute("data-globe-longitude", "105");
  await expect(mapShell).toHaveAttribute("data-globe-latitude", "28");
  const longitudeBeforeDrag = await mapShell.getAttribute("data-globe-longitude");
  const graticulePath = page.locator(".map-globe-graticule");
  const graticuleBeforeDrag = await graticulePath.getAttribute("d");
  await expect(mapShell).toHaveAttribute("data-map-interactive", "true");
  const mapBox = await page.getByLabel("世界摄影足迹地图").boundingBox();
  if (!mapBox) throw new Error("Globe bounds are unavailable");
  await page.mouse.move(mapBox.x + mapBox.width * 0.5, mapBox.y + mapBox.height * 0.5);
  await page.mouse.down();
  await expect(mapShell).toHaveAttribute("data-map-dragging", "true");
  await page.mouse.move(mapBox.x + mapBox.width * 0.62, mapBox.y + mapBox.height * 0.55, {
    steps: 5,
  });
  await page.mouse.up();
  await expect(mapShell).not.toHaveAttribute(
    "data-globe-longitude",
    longitudeBeforeDrag ?? "",
  );
  await expect(graticulePath).not.toHaveAttribute("d", graticuleBeforeDrag ?? "");
  await expect(page).toHaveURL(/\/map\?view=globe$/);

  await page.getByRole("link", { name: "亚洲" }).click();
  await expect(page).toHaveURL(/\/map\/asia$/);
  await page.waitForLoadState("networkidle");
  await expect(page.locator(".public-map-page")).toHaveAttribute("data-map-mode", "flat");
  await expect(page.locator(".public-map-page")).toHaveAttribute("data-map-scene", "asia");
  await expect(page.locator(".map-sphere")).toHaveCount(0);
  await expect(page.getByRole("navigation", { name: "地图显示模式" })).toHaveCount(0);

  await page.goto("/map/europe?view=globe");
  await expect(page).toHaveURL(/\/map\/europe$/);
  await expect(page.locator(".public-map-page")).toHaveAttribute("data-map-mode", "flat");
  await expect(page.locator(".map-sphere")).toHaveCount(0);
  expect(browserErrors).toEqual([]);
});

test("square and classic world-map styles can be switched without losing context", async ({
  page,
}) => {
  await page.goto("/map/asia");

  const pageShell = page.locator(".public-map-page");
  await expect(pageShell).toHaveAttribute("data-map-style", "grid");
  await expect(page.locator(".map-grid-layer")).toHaveCount(1);

  const styleSwitch = page.getByLabel("地图样式切换");
  await styleSwitch.getByRole("link", { name: "地图" }).click();
  await expect(page).toHaveURL(/\/map\/asia\?display=classic$/);
  await expect(pageShell).toHaveAttribute("data-map-style", "classic");
  await expect(page.locator(".map-grid-layer")).toHaveCount(0);
  await expect(page.locator(".map-country-layer .world-country-path")).not.toHaveCount(0);
  await expect(styleSwitch.getByRole("link", { name: "地图" })).toHaveAttribute(
    "aria-current",
    "page",
  );

  await page.getByRole("link", { name: "全部" }).click();
  await expect(page).toHaveURL(/\/map\?display=classic$/);
  await expect(pageShell).toHaveAttribute("data-map-style", "classic");

  await page.getByRole("link", { name: "地球" }).click();
  await expect(page).toHaveURL(/\/map\?view=globe&display=classic$/);
  await expect(pageShell).toHaveAttribute("data-map-mode", "globe");
  await expect(pageShell).toHaveAttribute("data-map-style", "classic");

  await styleSwitch.getByRole("link", { name: "方格" }).click();
  await expect(page).toHaveURL(/\/map\?view=globe$/);
  await expect(pageShell).toHaveAttribute("data-map-style", "grid");
});

test("flat map camera remains usable on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/map/asia");

  await expect(page.locator(".map-region-dock")).toBeVisible();
  await expect(page.getByRole("navigation", { name: "全站导航" }).last()).toBeVisible();
  await expect(page.getByLabel("亚洲摄影足迹地图")).toHaveAttribute("viewBox", "0 0 390 844");
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
});

test("globe mode controls remain usable on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/map?view=globe");

  await expect(page.getByRole("navigation", { name: "地图显示模式" })).toBeVisible();
  await expect(page.locator(".map-region-dock")).toBeVisible();
  await expect(page.locator(".map-sphere")).toBeVisible();
  await expect(page.getByRole("navigation", { name: "全站导航" }).last()).toBeVisible();
  await expect(page.getByLabel("世界摄影足迹地图")).toHaveAttribute("viewBox", "0 0 390 844");
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
});
