import { describe, expect, it } from "vitest";
import type { StyleSpecification } from "maplibre-gl";
import { addCityHierarchy, publicCityFeatures, publicRegionFeatures } from "./cityLabels";

describe("public city hierarchy", () => {
  it("keeps national capitals and Guangzhou available without basemap tile selection", () => {
    const cities = publicCityFeatures().features;
    const find = (name: string) => cities.find(city => city.properties?.name === name)!;
    expect(find("北京市").properties?.tier).toBe(1);
    expect(find("广州市").properties?.tier).toBe(2);
    expect(find("深圳市").properties?.tier).toBe(2);
    expect(find("广州市").properties?.priority).toBeLessThan(find("深圳市").properties?.priority);
    expect(cities.filter(city => city.properties?.country === "CN").every(city =>
      city.properties?.name.endsWith("市") && !city.properties?.name.endsWith("市市"))).toBe(true);
    expect(cities.some(city => city.properties?.zh === "嘉峪关")).toBe(false);
    expect(new Set(cities.map(city => city.id)).size).toBe(cities.length);
  });

  it("uses local names with Chinese translations reserved for city details", () => {
    const cities = publicCityFeatures().features;
    expect(cities.find(city => city.properties?.zh === "东京")?.properties?.name).toBe("東京");
    expect(cities.find(city => city.properties?.zh === "巴黎")?.properties?.name).toBe("Paris");
    expect(cities.find(city => city.properties?.zh === "慕尼黑")?.properties?.name).toBe("München");
    expect(cities.find(city => city.properties?.zh === "莫斯科")?.properties?.name).toBe("Москва");
    for (const city of cities) {
      expect(city.geometry.coordinates.every(Number.isFinite)).toBe(true);
      expect(city.properties?.name).not.toMatch(/[\r\n]/);
    }
  });

  it("defers ordinary places, preserves countries and gives capitals collision priority", () => {
    const style: StyleSpecification = { version: 8, sources: {}, layers: [
      ...["label_city", "label_city_capital", "label_town", "label_village", "label_state", "label_country_1"].map(id => ({
        id, type: "symbol" as const, source: "basemap", "source-layer": "place", layout: { "text-field": "old bilingual" },
      })),
    ] };
    const updated = addCityHierarchy(style);
    expect(updated.layers.find(layer => layer.id === "label_city")?.minzoom).toBe(7);
    expect(updated.layers.find(layer => layer.id === "label_town")?.minzoom).toBe(9);
    expect(updated.layers.find(layer => layer.id === "label_village")?.minzoom).toBe(11);
    expect(updated.layers.some(layer => layer.id === "label_country_1")).toBe(true);
    expect(updated.layers.some(layer => layer.id === "label_city_capital")).toBe(false);
    const region = updated.layers.find(layer => layer.id === "lumina-region-label")!;
    const major = updated.layers.find(layer => layer.id === "lumina-city-tier-2")!;
    expect(region.minzoom).toBeLessThan(major.minzoom!);
    const ids = updated.layers.map(layer => layer.id);
    expect(ids.indexOf("lumina-region-label")).toBeGreaterThan(ids.indexOf("lumina-city-tier-2"));
    expect(ids.indexOf("lumina-city-tier-1")).toBeGreaterThan(ids.indexOf("lumina-region-label"));
    expect(ids.at(-1)).toBe("label_country_1");
    expect(updated.layers.find(layer => layer.id === "label_state")?.minzoom).toBe(region.maxzoom);
    expect(style.layers).toHaveLength(6);
    expect(style.sources).toEqual({});
  });

  it("provides native province names independently of basemap zoom generalization", () => {
    const regions = publicRegionFeatures().features;
    for (const name of ["广东", "新疆", "四川", "上海", "北京"]) {
      expect(regions.some(region => region.properties?.name === name)).toBe(true);
    }
    expect(regions.some(region => region.properties?.name === "Bayern")).toBe(true);
    expect(regions.every(region => !region.properties?.name.includes("\0"))).toBe(true);
    expect(new Set(regions.map(region => region.id)).size).toBe(regions.length);
  });
});
