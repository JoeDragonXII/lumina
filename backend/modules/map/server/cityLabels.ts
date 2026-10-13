import type { FeatureCollection, Point } from "geojson";
import type { ExpressionSpecification, StyleSpecification, SymbolLayerSpecification } from "maplibre-gl";
import cities from "@backend/modules/map/data/cityIndex.json";
import regions from "@backend/modules/map/data/regionIndex.json";
import chineseCityNames from "@backend/modules/map/data/chineseCityNames.json";

function cityName(name: string, country: string) {
  return country === "CN" && !name.endsWith("市") ? `${name}市` : name;
}

export function publicRegionFeatures(): FeatureCollection<Point> {
  return { type: "FeatureCollection", features: regions.map(region => ({
    type: "Feature", id: region.id,
    geometry: { type: "Point", coordinates: region.coordinates },
    properties: { name: region.name, priority: region.priority },
  })) };
}

export function publicCityFeatures(): FeatureCollection<Point> {
  return { type: "FeatureCollection", features: cities.map(city => ({
    type: "Feature", id: city.id,
    geometry: { type: "Point", coordinates: city.coordinates },
    properties: { name: cityName(city.name, city.country), zh: cityName(city.zh, city.country), country: city.country, tier: city.tier, priority: city.priority },
  })) };
}

const localName: ExpressionSpecification = ["coalesce", ["get", "name"], ["get", "name:nonlatin"], ["get", "name:latin"], ["get", "name_en"]];
const chineseAliases = new Map(chineseCityNames.flatMap(city =>
  city.aliases.map(alias => [alias, cityName(city.name, "CN")] as const)));
const ordinaryCityName: ExpressionSpecification = ["match",
  ["coalesce", ["get", "name:latin"], ["get", "name_en"], ["get", "name"]],
  ...[...chineseAliases].flat(), localName] as unknown as ExpressionSpecification;
const indexedNames = [...new Set(cities.flatMap(city => city.aliases))];
const ordinaryCity: ExpressionSpecification = ["!", ["match",
  ["coalesce", ["get", "name:latin"], ["get", "name_en"], ["get", "name"]], indexedNames, true, false]];

export function addCityHierarchy(style: StyleSpecification): StyleSpecification {
  const layers = style.layers.filter(layer => layer.id !== "label_city_capital").map(layer => {
    if (layer.type !== "symbol" || layer["source-layer"] !== "place") return layer;
    const label: SymbolLayerSpecification = { ...layer, layout: {
      ...layer.layout, "text-field": localName, "text-transform": "none", "text-letter-spacing": 0.01,
      "text-max-width": 32, "text-padding": 4,
    } };
    if (layer.id === "label_city") {
      label.minzoom = 7;
      label.filter = ["all", ["==", ["get", "class"], "city"], ordinaryCity];
      label.layout = { ...label.layout, "symbol-sort-key": ["coalesce", ["get", "rank"], 99],
        "text-field": ordinaryCityName,
        "text-font": ["Noto Sans Regular"], "text-size": ["interpolate", ["linear"], ["zoom"], 7, 11, 12, 14] };
    }
    if (layer.id === "label_town") label.minzoom = 9;
    if (layer.id === "label_village") label.minzoom = 11;
    if (layer.id === "label_state") {
      label.minzoom = 7;
      label.maxzoom = 9;
      label.layout = { ...label.layout, "text-font": ["Noto Sans Regular"] };
    }
    return label;
  });

  // Later symbol layers win collisions. Capitals precede major and regional cities.
  for (const [tier, minzoom, size, font] of [
    [3, 5.5, 12, "Noto Sans Regular"],
    [2, 4.5, 13, "Noto Sans Regular"],
    [1, 2.5, 14, "Noto Sans Bold"],
  ] as const) {
    layers.push({ id: `lumina-city-tier-${tier}`, type: "symbol", source: "lumina-cities", minzoom,
      filter: ["==", ["get", "tier"], tier],
      layout: {
        "text-field": ["get", "name"], "text-font": [font], "text-max-width": 32,
        "text-size": ["interpolate", ["linear"], ["zoom"], minzoom, size, 12, size + 2],
        "text-padding": 5, "symbol-sort-key": ["get", "priority"],
        "text-variable-anchor": ["center", "top", "bottom", "left", "right"],
        "text-radial-offset": 0.35, "text-allow-overlap": false,
      },
      paint: { "text-color": tier === 1 ? "#d3dbd6" : "#b8c2bd", "text-halo-color": "#101620", "text-halo-width": 1.2 },
    });
  }
  // Provinces orient the overview before major cities; capitals keep their priority.
  layers.splice(layers.length - 1, 0, {
    id: "lumina-region-label", type: "symbol", source: "lumina-regions", minzoom: 3, maxzoom: 7,
    layout: {
      "text-field": ["get", "name"], "text-font": ["Noto Sans Regular"], "text-max-width": 32,
      "text-size": ["interpolate", ["linear"], ["zoom"], 3, 11, 6, 13], "text-letter-spacing": 0.06,
      "symbol-sort-key": ["get", "priority"], "text-padding": 4, "text-allow-overlap": false,
      "text-variable-anchor": ["center", "top", "bottom"], "text-radial-offset": 0.3,
    },
    paint: { "text-color": "#a7b2ab", "text-halo-color": "#101620", "text-halo-width": 1.2 },
  });
  return { ...style, sources: { ...style.sources, "lumina-cities": {
    type: "geojson", data: "/api/public/map/cities?v=2",
    attribution: '<a href="https://www.naturalearthdata.com/downloads/10m-cultural-vectors/10m-populated-places/" target="_blank" rel="noopener">Natural Earth</a>',
  }, "lumina-regions": { type: "geojson", data: "/api/public/map/regions?v=1" } }, layers: [
    ...layers.filter(layer => !layer.id.startsWith("label_country_")),
    ...layers.filter(layer => layer.id.startsWith("label_country_")),
  ] };
}
