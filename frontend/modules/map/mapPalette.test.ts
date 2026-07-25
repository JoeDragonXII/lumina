import { describe, expect, it } from "vitest";

import {
  MAP_COLOR_PRESETS,
  createMapRenderPalette,
  isMapPaletteColors,
  mixHexColors,
} from "@/modules/map/mapPalette";

describe("mapPalette", () => {
  it("keeps the reference day and night colors exact", () => {
    expect(MAP_COLOR_PRESETS["night-violet"]).toEqual({
      accent: "#FE6CB7",
      focus: "#FFD9D1",
      land: "#00489D",
    });
    expect(MAP_COLOR_PRESETS.daylight).toEqual({
      accent: "#97FE98",
      focus: "#FFF2DF",
      land: "#363531",
    });
  });

  it("derives hover colors without changing the three source colors", () => {
    const source = MAP_COLOR_PRESETS["night-violet"];
    const rendered = createMapRenderPalette(source, "night-violet");

    expect(rendered.visited).toBe(source.accent);
    expect(rendered.focus).toBe(source.focus);
    expect(rendered.land).toBe(source.land);
    expect(rendered.hover).toMatch(/^#[0-9A-F]{6}$/);
    expect(source).toEqual(MAP_COLOR_PRESETS["night-violet"]);
  });

  it("mixes and validates hex colors", () => {
    expect(mixHexColors("#000000", "#FFFFFF", 0.5)).toBe("#808080");
    expect(
      isMapPaletteColors({
        accent: "#123456",
        focus: "#ABCDEF",
        land: "#000000",
      }),
    ).toBe(true);
    expect(
      isMapPaletteColors({
        accent: "#12345",
        focus: "#ABCDEF",
        land: "#000000",
      }),
    ).toBe(false);
  });
});
