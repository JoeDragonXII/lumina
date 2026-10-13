import { expect, test } from "@playwright/test";
import sharp from "sharp";

test("public navigation keeps one position, order and active state across pages", async ({ page }) => {
  test.setTimeout(90_000);
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  const image = await sharp({ create: { width: 600, height: 450, channels: 3, background: "#7a8882" } }).jpeg().toBuffer();
  await page.route("https://picsum.photos/**", route => route.fulfill({ contentType: "image/jpeg", body: image }));
  await page.route("**/api/openfreemap/**", route => route.abort());
  const pages = [["/", "首页"], ["/archive", "图集"], ["/map", "地图"], ["/timeline", "时间线"], ["/works", "图集"], ["/map/asia", "地图"], ["/map/asia/cn", "地图"], ["/map?view=legacy", "地图"]];
  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport);
    let baseline: { x: number; y: number; width: number; height: number } | null = null;
    for (const [path, active] of pages) {
      await page.mouse.move(viewport.width - 4, 4);
      await page.goto(path);
      const nav = page.getByRole("navigation", { name: "全站导航", exact: true });
      await expect(nav).toHaveCount(1);
      await expect(nav).toBeVisible();
      await expect(nav.locator('[aria-current="page"]')).toHaveAttribute("aria-label", active);
      expect(await nav.getByRole("link").evaluateAll(links => links.map(link => link.getAttribute("aria-label")))).toEqual(["首页", "图集", "地图", "时间线", "Studio"]);
      const box = await nav.boundingBox();
      expect(box).not.toBeNull();
      baseline ??= box;
      expect(box).toEqual(baseline);
      await page.evaluate(() => window.scrollTo({ top: 600, behavior: "instant" }));
      expect(await nav.boundingBox()).toEqual(baseline);
      await nav.getByRole("link", { name: "首页", exact: true }).hover();
      await expect.poll(async () => {
        const expanded = (await nav.boundingBox())!;
        return viewport.width >= 768 ? expanded.height : expanded.width;
      }).toBeGreaterThan(viewport.width >= 768 ? baseline!.height + 5 : baseline!.width + 5);
      const expanded = (await nav.boundingBox())!;
      if (viewport.width >= 768) {
        expect(expanded.x).toBe(20);
        expect(expanded.y + expanded.height / 2).toBeCloseTo(viewport.height / 2, 0);
      } else {
        expect(expanded.x + expanded.width / 2).toBeCloseTo(viewport.width / 2, 0);
        expect(expanded.y + expanded.height).toBeCloseTo(viewport.height - 16, 0);
      }
      await page.mouse.move(viewport.width - 4, 4);
      await expect.poll(async () => {
        const settled = (await nav.boundingBox())!;
        return Math.abs(settled.width - baseline!.width) + Math.abs(settled.height - baseline!.height);
      }).toBeLessThan(0.1);
    }
  }

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/archive");
  const nav = page.getByRole("navigation", { name: "全站导航", exact: true });
  await nav.evaluate(element => element.setAttribute("data-persistence-check", "mounted"));
  await nav.getByRole("link", { name: "时间线", exact: true }).click();
  await expect(page).toHaveURL(/\/timeline$/);
  await expect(nav).toHaveAttribute("data-persistence-check", "mounted");
  await expect(nav.locator('[aria-current="page"]')).toHaveAttribute("aria-label", "时间线");
  await page.goBack();
  await expect(nav.locator('[aria-current="page"]')).toHaveAttribute("aria-label", "图集");
  const appearance = page.getByRole("button", { name: "切换背景", exact: true });
  await expect(appearance).toBeVisible();
  await expect(nav.getByRole("button")).toHaveCount(0);
  const previous = await appearance.getAttribute("aria-pressed");
  await appearance.click();
  await expect(appearance).toHaveAttribute("aria-pressed", previous === "true" ? "false" : "true");
  await nav.getByRole("link", { name: "地图", exact: true }).focus();
  await expect(nav.getByRole("link", { name: "地图", exact: true })).toBeFocused();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.mouse.move(1400, 4);
  const reducedBox = await nav.boundingBox();
  await nav.getByRole("link", { name: "首页", exact: true }).hover();
  expect(await nav.boundingBox()).toEqual(reducedBox);
  expect(errors).toEqual([]);
});
