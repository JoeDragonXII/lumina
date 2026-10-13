import { expect, test } from "@playwright/test";
import sharp from "sharp";

test("real archive covers filter, open in place and restore keyboard focus", async ({ page }) => {
  const buffer = await sharp({ create: { width: 640, height: 420, channels: 3, background: "#8b9c91" } }).jpeg().toBuffer();
  await page.goto("/studio/login");
  await page.getByLabel("管理密码").fill("1234");
  await page.getByRole("button", { name: "进入 Studio" }).click();
  await expect(page).toHaveURL(/\/studio$/);
  const upload = await page.request.post("/api/studio/assets", { multipart: { files: { name: "cover.jpg", mimeType: "image/jpeg", buffer } } });
  expect(upload.ok()).toBe(true);
  const asset = (await upload.json()).assets[0].asset;
  const result = await page.request.post("/api/studio/collections", { data: { title: "封面预览测试", slug: "archive-cover-preview", category: "旅行", visibility: "public", assetIds: [asset.id] } });
  expect(result.status()).toBe(201);
  const id = (await result.json()).collection.id;
  try {
  await page.goto("/archive");
  await page.getByRole("navigation", { name: "图集分类" }).getByRole("link", { name: /旅行/ }).click();
  await expect(page).toHaveURL(/category=/);
  await page.reload();
  const trigger = page.getByRole("button", { name: "预览 封面预览测试 封面" });
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "照片详情" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText("640 × 420")).toBeVisible();
  await expect(dialog.getByText("CAMERA", { exact: true })).toHaveCount(0);
  await expect(dialog.locator("img")).toHaveCSS("opacity", "1");
  await page.screenshot({ path: "test-results/paper-photo-dialog.png" });
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
  await page.getByRole("link", { name: "打开图集 封面预览测试", exact: true }).click();
  await expect(page).toHaveURL(/\/works\/archive-cover-preview$/);
  await page.goBack();
  await expect(page).toHaveURL(/category=/);
  await expect(trigger).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.goto("/archive?category=does-not-exist");
  await expect(page.getByRole("heading", { name: "没有符合条件的图集" })).toBeVisible();
  await page.goto("/");
  await expect(page.getByRole("region", { name: "首页照片墙" })).toBeVisible();
  await expect(page.locator(`.home-flow-group:not([aria-hidden="true"]) a.home-flow-card img[src*="${asset.id}"]`)).toHaveCount(1);
  } finally { await page.request.delete(`/api/studio/collections/${id}`, { timeout: 5000 }).catch(() => undefined); }
});

test("paper library keeps creation, filters and responsive editing usable", async ({ page }) => {
  test.setTimeout(60000);
  await page.goto("/studio/login");
  await page.getByLabel("管理密码").fill("1234");
  await page.getByRole("button", { name: "进入 Studio" }).click();
  await expect(page).toHaveURL(/\/studio$/);
  await page.getByRole("link", { name: "新建图集", exact: true }).click();
  await page.locator('input[type="file"]').first().setInputFiles({
    name: "paper-test.jpg", mimeType: "image/jpeg",
    buffer: await sharp({ create: { width: 640, height: 420, channels: 3, background: "#8b9c91" } }).jpeg().toBuffer(),
  });
  await expect(page.getByText(/1 张照片已就绪/)).toBeVisible({ timeout: 30000 });
  await page.getByLabel("标题", { exact: true }).fill("相纸测试图集");
  await page.getByLabel("状态").selectOption("public");
  await page.getByRole("button", { name: "保存图集" }).click();
  await expect(page).toHaveURL(/\/studio\/[a-f0-9-]+$/);
  const albumId = page.url().match(/\/studio\/([a-f0-9-]+)$/)?.[1];
  expect(albumId).toBeTruthy();
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: "test-results/paper-editor-mobile.png", fullPage: true });
  await page.goto("/studio");
  await expect(page.getByRole("link", { name: /相纸测试图集/ })).toBeVisible();
  await page.getByRole("group", { name: "图集状态" }).getByRole("button", { name: /^草稿\s+\d+$/ }).click();
  await expect(page.getByText("没有找到图集")).toBeVisible();
  await page.getByRole("button", { name: "清除筛选" }).click();
  await page.getByRole("textbox", { name: "搜索图集" }).fill("不存在的图集");
  await expect(page.getByText("没有找到图集")).toBeVisible();
  await page.getByRole("button", { name: "清除搜索" }).click();
  await expect(page.getByRole("link", { name: /相纸测试图集/ })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: "test-results/paper-library-mobile.png", fullPage: true });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({ path: "test-results/paper-library-desktop.png", fullPage: true });
  // A public album without coordinates remains browsable on the map.
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.route("**/api/openfreemap/**", route => route.abort());
  await page.goto("/");
  const homePhoto = page.locator('a.home-flow-card').first();
  await expect(homePhoto).toHaveAttribute("href", /\/map\?collection=/);
  await homePhoto.click();
  await expect(page).toHaveURL(/\/map\?collection=/);
  const panel = page.getByRole("complementary", { name: "图集照片瀑布流" });
  await expect(panel.getByRole("heading", { name: "相纸测试图集" })).toBeVisible();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  const photo = panel.getByRole("button", { name: /第 1 张照片/ });
  await photo.click();
  await expect(page.getByRole("dialog", { name: "照片详情" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(photo).toBeFocused();
  await page.screenshot({ path: "test-results/map-album-flow-desktop.png" });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: "test-results/map-album-flow-mobile.png" });
  await panel.getByRole("button", { name: "关闭图集", exact: true }).click();
  await expect(panel).not.toBeVisible();
  await expect(page).toHaveURL(/\/map$/);
  await page.goBack();
  await expect(panel).toBeVisible();
  await page.reload();
  await expect(panel).toBeVisible();
  const collections = await (await page.request.get("/api/studio/collections")).json();
  const located = await page.request.post("/api/studio/collections", { data: {
    title: "地图入口测试", slug: "map-entry-test", category: "旅行", visibility: "public", assetIds: [collections[0].photos[0].id],
    location: { countryCode: "CN", countryName: "中国", city: "杭州", displayName: "杭州", latitude: 30.27, longitude: 120.15, source: "manual", confirmed: true },
  } });
  expect(located.status()).toBe(201);
  const locatedCollection = await located.json() as { collection: { id: string } };
  await page.unroute("**/api/openfreemap/**");
  await page.route("**/api/openfreemap/styles/positron**", route => route.fulfill({ json: {
    version: 8, sources: { land: { type: "geojson", data: { type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates: [[[70, 0], [150, 0], [150, 60], [70, 60], [70, 0]]] } } } },
    layers: [{ id: "land", type: "fill", source: "land", paint: { "fill-color": "#eeebe5" } }],
  } }));
  await page.goto("/map");
  await page.getByRole("button", { name: "地图入口测试，1 张照片", exact: true }).click();
  await expect(page).toHaveURL(/collection=map-entry-test/);
  await expect(panel.getByRole("heading", { name: "地图入口测试" })).toBeVisible();
  await page.request.delete(`/api/studio/collections/${locatedCollection.collection.id}`);
  await page.request.delete(`/api/studio/collections/${albumId}`);
});
