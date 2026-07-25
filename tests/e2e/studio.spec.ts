import { expect, test } from "@playwright/test";
import sharp from "sharp";

test("admin can sign in, upload a photo and create a public collection", async ({ page }) => {
  const clientErrors: string[] = [];
  const failedResponses: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error" && !message.text().startsWith("Failed to load resource")) clientErrors.push(message.text());
  });
  page.on("pageerror", (error) => clientErrors.push(error.message));
  page.on("response", (response) => {
    if (response.status() >= 400 && !(response.status() === 401 && response.url().endsWith("/api/studio/auth/login"))) {
      failedResponses.push(`${response.status()} ${response.url()}`);
    }
  });
  await page.goto("/studio");
  await expect(page).toHaveURL(/\/studio\/login$/);

  await page.getByLabel("管理密码").fill("wrong");
  const [wrongResponse] = await Promise.all([
    page.waitForResponse((response) => response.url().endsWith("/api/studio/auth/login")),
    page.getByRole("button", { name: "进入 Studio" }).click(),
  ]);
  expect(wrongResponse.status()).toBe(401);
  await expect(page.getByText("密码不正确。")).toBeVisible();

  await page.getByLabel("管理密码").fill("1234");
  await page.getByRole("button", { name: "进入 Studio" }).click();
  await expect(page).toHaveURL(/\/studio$/);
  await expect(page.locator('nav a[href="/studio"]')).toHaveCSS("color", "rgb(255, 255, 255)");
  await expect(page.locator('main a[href="/studio/new"]')).toHaveCSS("color", "rgb(255, 255, 255)");

  await page.getByRole("link", { name: "新建图集" }).click();
  const images = await Promise.all(["#3f6656", "#875044", "#36587a"].map(async (background, index) => ({
    name: `playwright-album-${index + 1}.jpg`,
    mimeType: "image/jpeg",
    buffer: await sharp({ create: { width: index === 1 ? 420 : 640, height: index === 1 ? 640 : 420, channels: 3, background } }).jpeg().toBuffer(),
  })));
  await page.locator('input[type="file"]').first().setInputFiles(images);
  await expect(page.getByText(/3 张照片已就绪；拍摄时间 0\/3；GPS 0\/3/)).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText("原件无 GPS 定位").first()).toBeVisible();

  await page.getByLabel("标题").fill("自动化测试图集");
  await page.getByLabel("状态").selectOption("public");
  await page.getByRole("button", { name: "保存图集" }).click();
  await expect(page).toHaveURL(/\/studio\/[a-f0-9-]+$/);
  await expect(page.getByRole("heading", { name: "自动化测试图集" })).toBeVisible();

  await page.goto("/studio");
  await expect(page.getByRole("link", { name: /自动化测试图集/ })).toBeVisible();

  const studioResponse = await page.request.get("/api/studio/collections");
  const studioCollections = (await studioResponse.json()) as Array<{ photos: Array<{ id: string }> }>;
  const privateResponse = await page.request.post("/api/studio/collections", {
    data: {
      title: "不公开测试图集",
      slug: "private-playwright-album",
      category: "日常",
      visibility: "private",
      assetIds: [studioCollections[0].photos[0].id],
    },
  });
  expect(privateResponse.status()).toBe(201);
  const sharedAssetId = studioCollections[0].photos[0].id;
  for (const collection of [
    {
      title: "河南测试足迹",
      slug: "henan-playwright-memory",
      category: "旅行",
      visibility: "public",
      assetIds: [sharedAssetId],
      location: { countryCode: "CN", countryName: "中国", regionCode: "henan", regionName: "河南", city: "郑州", displayName: "中国 · 河南 · 郑州", latitude: 34.7466, longitude: 113.6254, source: "manual", confirmed: true },
    },
    {
      title: "东京测试足迹",
      slug: "tokyo-playwright-memory",
      category: "旅行",
      visibility: "public",
      assetIds: [sharedAssetId],
      location: { countryCode: "JP", countryName: "日本", city: "东京", displayName: "日本 · 东京", latitude: 35.6762, longitude: 139.6503, source: "manual", confirmed: true },
    },
  ]) {
    const response = await page.request.post("/api/studio/collections", { data: collection });
    expect(response.status()).toBe(201);
  }

  await page.goto("/");
  await expect(page.getByRole("heading", { name: /照片留下.*时间继续/ })).toBeVisible();
  await expect(page.getByText("自动化测试图集").first()).toBeVisible();
  await expect(page.getByText("不公开测试图集")).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole("heading", { name: /照片留下.*时间继续/ })).toBeVisible();

  await page.goto("/works");
  await page.goto("/works?category=旅行");
  await expect(page).toHaveURL(/category=/);
  await expect(page.getByText("河南测试足迹").first()).toBeVisible();
  await page.getByRole("link", { name: "清除筛选" }).click();
  await page.getByRole("link", { name: /自动化测试图集/ }).click();
  await expect(page.getByRole("heading", { name: "自动化测试图集" })).toBeVisible();
  await expect.poll(() => page.locator("main img").first().evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0);
  const firstPhoto = page.getByRole("button", { name: /打开 自动化测试图集 第 1 张照片/ });
  await firstPhoto.click();
  await expect(page.getByRole("dialog", { name: /自动化测试图集 照片浏览/ })).toBeVisible();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByText("02 / 03")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(firstPhoto).toBeFocused();

  await page.goto("/timeline");
  await expect(page.getByText("自动化测试图集")).toBeVisible();
  await expect(page.getByText("不公开测试图集")).toHaveCount(0);

  await page.goto("/map");
  await expect(page.getByLabel("中国，1 个图集")).toBeVisible();
  await expect(page.getByLabel("日本，1 个图集")).toBeVisible();
  await page.getByLabel("中国，1 个图集").click();
  await page.getByRole("link", { name: /进入地点档案/ }).click();
  await expect(page).toHaveURL(/\/map\/china$/);
  await expect(page.getByLabel("河南，1 个图集")).toBeVisible();
  await page.getByLabel("河南，1 个图集").click();
  await expect(page.getByRole("link", { name: /进入省份档案/ })).toBeVisible();
  await page.goto("/province/henan");
  await expect(page).toHaveURL(/\/map\/china\/henan$/);
  await expect(page.getByText("河南测试足迹")).toBeVisible();
  await page.goto("/map/jp");
  await expect(page.getByText("东京测试足迹")).toBeVisible();

  await page.goto("/studio/settings");
  await page.getByRole("button", { name: "创建备份" }).click();
  await expect(page.getByText("备份已创建。")).toBeVisible();
  await page.getByPlaceholder("清空全部数据").fill("清空全部数据");
  await page.getByRole("button", { name: "清空并建立恢复点" }).click();
  await expect(page.getByText("资料库已清空，可从恢复点找回。")).toBeVisible();
  await page.goto("/works");
  await expect(page.getByText("自动化测试图集")).toHaveCount(0);

  await page.goto("/studio/settings");
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "恢复" }).first().click();
  await expect(page.getByText(/已恢复 \d+ 个图集。/)).toBeVisible();
  await page.goto("/works");
  await expect(page.getByText("自动化测试图集")).toBeVisible();

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /照片留下.*时间继续/ })).toBeVisible();
  await page.screenshot({ path: "test-results/qa-home-desktop.png", fullPage: true });
  await page.goto("/map");
  await expect(page.locator('svg[aria-label="亚洲摄影足迹地图"] path')).toHaveCount(49);
  await page.screenshot({ path: "test-results/qa-map-desktop.png", fullPage: true });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.getByRole("navigation").last()).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: "test-results/qa-home-mobile.png", fullPage: true });
  await page.goto("/map");
  const mapBox = await page.locator('svg[aria-label="亚洲摄影足迹地图"]').boundingBox();
  expect(mapBox?.width).toBeGreaterThan(300);
  expect(mapBox?.height).toBeGreaterThan(400);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: "test-results/qa-map-mobile.png", fullPage: true });

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/works");
  await expect(page.locator(".public-experience")).toHaveAttribute("data-reduced-motion", "true");

  expect(clientErrors).toEqual([]);
  expect(failedResponses).toEqual([]);
});
