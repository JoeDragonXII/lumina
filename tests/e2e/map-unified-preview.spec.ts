import { expect, test } from "@playwright/test";

test("unified map preview opens photo cards without a journey sheet", async ({ page }) => {
  const browserErrors: string[] = [];
  page.on("pageerror", (error) => browserErrors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") browserErrors.push(message.text());
  });

  await page.goto("/preview/map-unified");

  await expect(page.getByLabel("广州与上海影像位置地图").locator("canvas")).toBeVisible();
  await expect(page.getByRole("navigation", { name: "预览全站导航" })).toBeVisible();
  await expect(page.getByText("沿途影像")).toHaveCount(0);
  await expect(page.getByRole("region", { name: "已选图集" })).toHaveCount(0);
  await expect(page.locator("button[data-selected]")).toHaveCount(5);
  await expect(page.getByRole("button", { name: "轨迹" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "播放行程" })).toHaveCount(0);

  const mapPhotoMarker = page.getByRole("button", { name: "查看广州照片" });
  await expect(mapPhotoMarker).toBeVisible();
  await expect(mapPhotoMarker).toHaveCSS("transition-property", "opacity");
  await mapPhotoMarker.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog", { name: "广州照片查看器" })).toBeVisible();
  await page.keyboard.press("Escape");

  await page.getByRole("button", { name: "图层" }).click();
  const gridToggle = page.getByRole("button").filter({ hasText: "坐标网格" });
  await expect(gridToggle).toContainText("关闭");
  await gridToggle.click();
  await expect(gridToggle).toContainText("开启");

  await page.getByRole("button", { name: "查看上海照片" }).click();
  const shanghaiDialog = page.getByRole("dialog", { name: "上海照片查看器" });
  await expect(shanghaiDialog).toBeVisible();
  await expect(page.getByRole("navigation", { name: "查看图集中的照片" })).toHaveCount(0);
  await expect(shanghaiDialog).not.toContainText("黄浦江入夜前");
  await expect(shanghaiDialog).not.toContainText("影像地图");
  const info = page.getByRole("complementary", { name: "图片信息" });
  await expect(info).toHaveCSS("border-left-width", "1px");
  await expect(info.locator("section").first()).toHaveCSS("border-radius", "0px");
  await expect(info).toContainText("1440 × 1080");
  await expect(info.locator("dd").filter({ hasText: "—" })).toHaveCount(0);
  await expect(info).not.toContainText("拍摄信息");
  await expect(page.getByRole("img", { name: "上海摄影作品" }).locator("..")).toHaveCSS("border-radius", "12px");
  await page.getByRole("button", { name: "下一张", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "广州照片查看器" })).toBeVisible();
  await expect(page.getByRole("dialog", { name: "广州照片查看器" })).not.toContainText("老城的骑楼");
  await page.keyboard.press("Escape");

  await page.getByRole("button", { name: "查看全部照片位置" }).click();
  await page.getByRole("button", { name: "查看杭州照片" }).click();
  await expect(page.getByRole("dialog", { name: "杭州照片查看器" })).toBeVisible();
  await expect(page.getByRole("button", { name: "关闭", exact: true })).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("dialog", { name: "上海照片查看器" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);

  expect(browserErrors).toEqual([]);
});

test("unified map preview keeps mobile map cards and viewer usable", async ({ page }) => {
  const browserErrors: string[] = [];
  page.on("pageerror", (error) => browserErrors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") browserErrors.push(message.text());
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/preview/map-unified");

  await expect(page.getByRole("navigation", { name: "移动端全站导航" })).toBeVisible();
  await expect(page.getByRole("button", { name: "图层" })).toBeVisible();
  await page.getByRole("button", { name: "数据" }).click();
  await expect(page.getByText("位置数据")).toBeVisible();
  await expect(page.getByText("23.1291° N", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "收起仪器面板" }).click();

  await expect(page.getByRole("button", { name: "展开照片面板" })).toHaveCount(0);
  await page.getByRole("button", { name: "查看广州照片" }).locator("span").first().click();
  const dialog = page.getByRole("dialog", { name: "广州照片查看器" });
  await expect(dialog).toBeVisible();
  const bounds = await dialog.boundingBox();
  expect(bounds).not.toBeNull();
  expect(bounds!.x).toBeGreaterThanOrEqual(0);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(390);
  expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(844);
  await page.getByRole("button", { name: "下一张", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "珠江照片查看器" })).toBeVisible();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "查看全部照片位置" }).click();
  await page.getByRole("button", { name: "查看车窗照片" }).locator("span").first().click();
  await expect(page.getByRole("dialog", { name: "车窗照片查看器" })).toBeVisible();
  await expect(page.getByRole("dialog", { name: "车窗照片查看器" })).not.toContainText("窗外的田野");
  const mobileInfo = page.getByRole("complementary", { name: "图片信息" });
  await expect(mobileInfo).toBeVisible();
  await expect(mobileInfo).toHaveCSS("border-top-width", "1px");
  expect(browserErrors).toEqual([]);
});

test("unified map preview anchors photo cards to their map coordinates in tall windows", async ({ page }) => {
  await page.setViewportSize({ width: 1378, height: 1228 });
  await page.goto("/preview/map-unified");

  const guangzhou = page.getByRole("button", { name: "查看广州照片" });
  const shanghai = page.getByRole("button", { name: "查看上海照片" });
  await expect(guangzhou).toBeVisible();
  await expect(shanghai).toBeVisible();
  await expect(guangzhou).toHaveCSS("position", "absolute");
  await expect(shanghai).toHaveCSS("position", "absolute");

  const guangzhouBounds = await guangzhou.boundingBox();
  const shanghaiBounds = await shanghai.boundingBox();
  expect(guangzhouBounds).not.toBeNull();
  expect(shanghaiBounds).not.toBeNull();
  // Shanghai is north-east of Guangzhou: its marker must not drift down with DOM order.
  expect(shanghaiBounds!.y).toBeLessThan(guangzhouBounds!.y);
  expect(shanghaiBounds!.x).toBeGreaterThan(guangzhouBounds!.x);
  expect(shanghaiBounds!.y).toBeGreaterThanOrEqual(0);
  expect(guangzhouBounds!.y + guangzhouBounds!.height).toBeLessThanOrEqual(1228);
});
