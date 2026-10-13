import { expect, test } from "@playwright/test";
import sharp from "sharp";

test("timeline groups photos, preserves URL filters and works on mobile and keyboard", async ({ page }) => {
  test.setTimeout(120_000);
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => { if (message.type() === "error" && !message.text().startsWith("Failed to load resource")) errors.push(message.text()); });
  await page.goto("/studio/login");
  await page.getByLabel("管理密码").fill("1234");
  await page.getByRole("button", { name: "进入 Studio" }).click();
  await expect(page).toHaveURL(/\/studio$/);
  const buffer = await sharp({ create: { width: 800, height: 600, channels: 3, background: "#8d9a8e" } }).jpeg().toBuffer();
  const uploaded = await page.request.post("/api/studio/assets", { multipart: { files: { name: "timeline.jpg", mimeType: "image/jpeg", buffer } } });
  expect(uploaded.ok()).toBe(true);
  const assetId = (await uploaded.json()).assets[0].asset.id as string;
  const ids: string[] = [];
  try {
    for (const data of [
      { title: "年历九月", slug: "timeline-september", dateStart: "2024-09-10" },
      { title: "年历一月", slug: "timeline-january", dateStart: "2024-01-02" },
      { title: "跨年相册", slug: "timeline-cross-year", dateStart: "2023-12-30", dateEnd: "2024-01-03" },
      { title: "无日期相册", slug: "timeline-undated" },
      { title: "私密年历", slug: "timeline-private", visibility: "private" },
    ]) {
      const response = await page.request.post("/api/studio/collections", { data: {
        category: "旅行", visibility: "public", assetIds: [assetId],
        location: { countryCode: "CN", countryName: "中国", city: "杭州", displayName: "杭州", source: "manual", confirmed: true }, ...data,
      } });
      expect(response.status(), await response.text()).toBe(201);
      ids.push((await response.json()).collection.id);
    }
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/timeline");
    await expect(page.getByRole("heading", { name: "时间线", exact: true })).toBeVisible();
    await expect(page.getByText("私密年历")).toHaveCount(0);
    const card = page.locator('[data-timeline]:visible [data-timeline-entry="timeline-september"]');
    await expect(card.locator("img")).toBeVisible();
    expect((await card.boundingBox())!.y).toBeLessThan(600);
    await expect(page.locator('[data-timeline-year="undated"]')).toContainText("无日期相册");
    const nav = page.getByRole("navigation", { name: "时间线年份" });
    await nav.getByRole("link", { name: "2024", exact: true }).click();
    await expect(page).toHaveURL(/year=2024/);
    await expect(page.locator('[data-timeline-year="2024"]')).toContainText("跨年相册");
    await expect(page.locator('[data-timeline-entry="timeline-cross-year"]')).toHaveCount(1);
    await expect(page.locator('[data-timeline-year="2023"]')).toHaveCount(0);
    await expect(page.getByText("无日期相册")).toHaveCount(0);
    const filter = page.locator("summary", { hasText: "筛选" }).last();
    await filter.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("form", { name: "时间线筛选" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(filter).toBeFocused();
    await expect(page.getByRole("form", { name: "时间线筛选" })).not.toBeVisible();
    await filter.click();
    await page.getByRole("combobox", { name: "分类", exact: true }).selectOption("旅行");
    await page.getByRole("combobox", { name: "国家", exact: true }).selectOption("CN");
    await page.getByLabel("城市", { exact: true }).fill("杭州");
    await page.getByRole("button", { name: "应用筛选" }).click();
    await expect(page).toHaveURL(/year=2024.*category=.*country=CN.*city=/);
    await page.reload();
    await expect(card).toBeVisible();
    await nav.getByRole("link", { name: "2023", exact: true }).click();
    await expect(page).toHaveURL(/year=2023.*category=.*country=CN.*city=/);
    await expect(page.getByText("跨年相册", { exact: true })).toBeVisible();
    await page.goBack();
    await expect(page).toHaveURL(/year=2024/);
    await expect(card).toBeVisible();
    await page.getByRole("link", { name: "打开 年历九月", exact: true }).click();
    await expect(page).toHaveURL(/\/works\/timeline-september$/);
    await page.goBack();
    await expect(card).toBeVisible();

    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/timeline?year=2024");
    await expect(card).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(await card.locator("img").evaluate(image => parseFloat(getComputedStyle(image).transitionDuration))).toBeLessThanOrEqual(0.001);
    await page.evaluate(() => window.scrollTo(0, 550));
    expect((await nav.boundingBox())!.y).toBeLessThan(60);
    await filter.click();
    await expect(page.getByLabel("城市", { exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.getByLabel("城市", { exact: true }).fill("不存在的城市");
    await page.getByRole("button", { name: "应用筛选" }).click();
    await expect(page.getByRole("heading", { name: "没有符合条件的图集" })).toBeVisible();
    await page.getByRole("link", { name: "清除筛选", exact: true }).first().click();
    await expect(page).toHaveURL(/\/timeline$/);
    await nav.getByRole("link", { name: "未标注", exact: true }).click();
    await expect(page).toHaveURL(/year=undated/);
    await expect(page.getByText("无日期相册", { exact: true })).toBeVisible();
    await expect(page.locator('[data-timeline-entry^="timeline-"]')).toHaveCount(1);
    await page.route("**/api/media/**", route => route.abort());
    await page.reload();
    await expect(page.locator('[data-timeline-entry="timeline-undated"]').getByText("封面暂不可用")).toBeVisible();
    await page.getByRole("link", { name: "打开 无日期相册", exact: true }).click();
    await expect(page).toHaveURL(/\/works\/timeline-undated$/);
    expect(errors).toEqual([]);
  } finally {
    for (const id of ids) await page.request.delete(`/api/studio/collections/${id}`, { timeout: 5_000 }).catch(() => undefined);
  }
});
