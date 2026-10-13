import type { StyleSpecification } from "maplibre-gl";
import { addCityHierarchy } from "@backend/modules/map/server/cityLabels";

/** Keep the photography map focused on regions and useful navigation. */
export function simplifyPublicMapStyle(style: StyleSpecification): StyleSpecification {
  return addCityHierarchy({
    ...style,
    layers: style.layers.filter(layer => {
      const sourceLayer = "source-layer" in layer ? layer["source-layer"] : undefined;
      if (/building/i.test(`${layer.id} ${sourceLayer ?? ""}`)) return false;
      if (sourceLayer && /^(building|poi|housenumber|aeroway|aerodrome_label)$/.test(sourceLayer)) return false;
      return !/^(label_other|highway_path|highway-name-path|highway-name-minor|highway-shield-.*|road_shield_.*|railway_service.*)$/.test(layer.id);
    }),
  });
}
