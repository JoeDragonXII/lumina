import fs from "node:fs/promises";
import { ExifTool } from "exiftool-vendored";
import { expect, test } from "@playwright/test";
import sharp from "sharp";

async function createLocatedPhoto(
  path: string,
  color: string,
  latitude: number,
  longitude: number,
  capturedAt: string,
) {
  await sharp({ create: { width: 720, height: 480, channels: 3, background: color } })
    .jpeg({ quality: 88 })
    .toFile(path);
  const exifTool = new ExifTool({ maxProcs: 1 });
  try {
    await exifTool.write(path, {
      GPSLatitude: latitude,
      GPSLongitude: longitude,
      GPSLatitudeRef: latitude >= 0 ? "N" : "S",
      GPSLongitudeRef: longitude >= 0 ? "E" : "W",
      "EXIF:DateTimeOriginal": capturedAt,
    });
  } finally {
    await exifTool.end();
  }
}

test("photo map links collections, exact positions, viewer state and history without routes", async ({ page }, testInfo) => {
  test.setTimeout(180_000);
  const mediaDirectory = testInfo.outputPath("located-media");
  await fs.mkdir(mediaDirectory, { recursive: true });
  const firstPath = `${mediaDirectory}/route-start.jpg`;
  const secondPath = `${mediaDirectory}/route-end.jpg`;
  await createLocatedPhoto(firstPath, "#956f4f", 23.1291, 113.2644, "2026:01:02 10:00:00");
  await createLocatedPhoto(secondPath, "#506b78", 31.2304, 121.4737, "2026:01:03 12:00:00");

  const clientErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error" && !message.text().startsWith("Failed to load resource")) {
      clientErrors.push(message.text());
    }
  });
  page.on("pageerror", (error) => clientErrors.push(error.message));

  let collectionId: string | undefined;
  try {
    await page.goto("/studio/login");
    await page.getByLabel("管理密码").fill("1234");
    await page.getByRole("button", { name: "进入 Studio" }).click();
    await expect(page).toHaveURL(/\/studio$/);
    await page.goto("/studio/new");
    await page.locator('input[type="file"]').first().setInputFiles([firstPath, secondPath]);
    await expect(page.getByText(/GPS 2\/2/)).toBeVisible({ timeout: 30_000 });

    await page.getByLabel("标题").fill("地图摄影路线测试");
    await page.getByLabel("链接标识").fill("map-photo-route-playwright");
    await page.getByLabel("状态").selectOption("public");
    await page.getByLabel("国家代码").fill("CN");
    await page.getByLabel("国家", { exact: true }).fill("中国");
    await page.getByLabel("城市").fill("广州");
    await page.getByLabel("展示名称").fill("中国 · 广州");
    await page.getByLabel("纬度").fill("23.1291");
    await page.getByLabel("经度").fill("113.2644");
    await page.getByLabel("地点信息已经确认").check();
    await page.getByRole("button", { name: "保存图集" }).click();
    await expect(page).toHaveURL(/\/studio\/[a-f0-9-]+$/);
    collectionId = page.url().match(/\/studio\/([a-f0-9-]+)$/)?.[1];

    await page.goto("/map?collection=map-photo-route-playwright");
    await expect(page.getByRole("heading", { name: "地图摄影路线测试" })).toBeVisible();
    const map = page.getByRole("application", { name: /手绘印刷风格摄影地图/ });
    await expect(map).toHaveAttribute("data-route-points", "0", { timeout: 30_000 });
    await expect(page.locator('[data-marker-kind="photo"]')).toHaveCount(2);
    await expect.poll(() => page.evaluate(() => Boolean(localStorage.getItem("lumina-photo-map-view-v1")))).toBe(true);

    await page.locator('[data-marker-kind="photo"]').first().click();
    await expect(page).toHaveURL(/collection=map-photo-route-playwright.*photo=/);
    await expect(page.getByRole("dialog", { name: "照片详情" })).toBeVisible();
    await page.goBack();
    await expect(page).not.toHaveURL(/photo=/);
    await expect(page.getByRole("heading", { name: "地图摄影路线测试" })).toBeVisible();

    const firstThumbnail = page.getByRole("button", { name: /第 1 张照片/ });
    await firstThumbnail.click();
    const firstPhotoUrl = page.url();
    await page.keyboard.press("ArrowRight");
    await expect.poll(() => page.url()).not.toBe(firstPhotoUrl);
    await page.reload();
    await expect(page.getByRole("dialog", { name: "照片详情" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page).not.toHaveURL(/photo=/);

    await page.goto("/map?collection=map-photo-route-playwright&photo=missing-photo");
    await expect(page).toHaveURL(/collection=map-photo-route-playwright$/);
    await expect(page.getByRole("heading", { name: "地图摄影路线测试" })).toBeVisible();

    await page.setViewportSize({ width: 390, height: 844 });
    await page.reload();
    await expect(page.getByLabel("图集照片瀑布流")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.reload();
    await expect(map).toHaveAttribute("data-route-points", "0", { timeout: 30_000 });
    expect(clientErrors).toEqual([]);
  } finally {
    if (collectionId) {
      await page.request.delete(`/api/studio/collections/${collectionId}`, { timeout: 5_000 }).catch(() => undefined);
    }
  }
});
