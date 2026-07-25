import { expect, test } from "@playwright/test";

test("map palette switches presets and persists three custom colors", async ({
  page,
}) => {
  await page.goto("/map");
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  const pageShell = page.locator(".public-map-page");
  await expect(pageShell).toHaveAttribute("data-map-palette", "night-violet");

  await page.getByRole("button", { name: "地图配色" }).click();
  const panel = page.getByRole("region", { name: "地图自定义配色" });
  await expect(panel).toBeVisible();
  await expect(panel.getByLabel("足迹色色号")).toHaveValue("#FE6CB7");
  await expect(panel.getByLabel("焦点色色号")).toHaveValue("#FFD9D1");
  await expect(panel.getByLabel("基础色色号")).toHaveValue("#00489D");

  const accentInput = panel.getByLabel("足迹色色号");
  await accentInput.fill("#123456");
  await accentInput.press("Enter");
  await expect(pageShell).toHaveCSS("--map-custom-accent", "#123456");

  await panel.getByRole("button", { name: "白天" }).click();
  await expect(page).toHaveURL(/theme=daylight/);
  await expect(pageShell).toHaveAttribute("data-map-palette", "daylight");
  await expect(panel.getByLabel("足迹色色号")).toHaveValue("#97FE98");
  await expect(panel.getByLabel("焦点色色号")).toHaveValue("#FFF2DF");
  await expect(panel.getByLabel("基础色色号")).toHaveValue("#363531");

  await page.reload();
  await page.getByRole("button", { name: "地图配色" }).click();
  await expect(page.getByRole("region", { name: "地图自定义配色" })).toBeVisible();
  await expect(pageShell).toHaveAttribute("data-map-palette", "daylight");

  await panel.getByRole("button", { name: "黑夜" }).click();
  await expect(page).not.toHaveURL(/theme=daylight/);
  await expect(panel.getByLabel("足迹色色号")).toHaveValue("#123456");

  await panel.getByRole("button", { name: "恢复参考色" }).click();
  await expect(panel.getByLabel("足迹色色号")).toHaveValue("#FE6CB7");
});
