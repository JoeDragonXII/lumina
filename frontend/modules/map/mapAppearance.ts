import type { Map } from "maplibre-gl";

export function tintMapForNight(map: Map) {
  for (const layer of map.getStyle().layers ?? []) {
    const id = layer.id.toLowerCase();
    const sourceLayer = "source-layer" in layer ? layer["source-layer"] : undefined;
    // Also remove cached or alternate style variants containing building outlines.
    if (/building/i.test(`${id} ${sourceLayer ?? ""}`)) {
      map.removeLayer(layer.id);
      continue;
    }
    const isTransport = sourceLayer === "transportation" || sourceLayer === "transportation_name"
      || /road|street|highway|motorway|trunk|rail|tunnel|bridge/.test(id);
    if (layer.type === "background") {
      map.setPaintProperty(layer.id, "background-color", "#101620");
    } else if (layer.type === "fill") {
      map.setPaintProperty(layer.id, "fill-color", /water|ocean|lake|sea/.test(id) ? "#111d2b"
        : /park|wood|forest|grass|green/.test(id) ? "#192622"
          : /building/.test(id) ? "#242725" : "#1a2024");
      map.setPaintProperty(layer.id, "fill-opacity", 1);
    } else if (layer.type === "line") {
      map.setPaintProperty(layer.id, "line-color", /water|river|stream/.test(id) ? "#324650"
        : /boundary|admin|border/.test(id) ? "#5c625e"
          : /road|street|highway|motorway|trunk|rail/.test(id) ? "#414848" : "#364144");
      map.setPaintProperty(layer.id, "line-opacity", isTransport
        ? ["interpolate", ["linear"], ["zoom"], 8, 0, 10, 0.16, 12, 0.4, 13, 0.51]
        : /boundary/.test(id) ? 0.38 : 0.51);
    } else if (layer.type === "symbol" && layer.layout?.["text-field"]) {
      map.setPaintProperty(layer.id, "text-color", /region-label/.test(id) ? "#a7b2ab" : /tier-1/.test(id) ? "#d3dbd6" : /country|state|province/.test(id) ? "#c9cec9"
        : /city|town|place/.test(id) ? "#b8c2bd" : "#87948f");
      map.setPaintProperty(layer.id, "text-halo-color", "#101620");
      map.setPaintProperty(layer.id, "text-halo-width", 1);
    }
    if (isTransport && layer.type === "symbol") {
      const opacity = ["interpolate", ["linear"], ["zoom"], 9, 0, 11, 0.5, 13, 1];
      map.setPaintProperty(layer.id, "text-opacity", opacity);
      map.setPaintProperty(layer.id, "icon-opacity", opacity);
    }
  }
}

export function setCoordinateGrid(map: Map, visible: boolean) {
  const id = "lumina-coordinate-grid";
  if (!map.getSource(id)) {
    map.addSource(id, { type: "geojson", data: {
      type: "FeatureCollection",
      features: [
        ...Array.from({ length: 35 }, (_, i) => -170 + i * 10).map(lng => ({ type: "Feature" as const, properties: {}, geometry: { type: "LineString" as const, coordinates: [[lng, -80], [lng, 80]] } })),
        ...Array.from({ length: 17 }, (_, i) => -80 + i * 10).map(lat => ({ type: "Feature" as const, properties: {}, geometry: { type: "LineString" as const, coordinates: [[-180, lat], [180, lat]] } })),
      ],
    } });
    map.addLayer({ id, type: "line", source: id, paint: { "line-color": "#9aaba8", "line-opacity": 0.18, "line-width": 0.7 } });
  }
  map.setLayoutProperty(id, "visibility", visible ? "visible" : "none");
}
