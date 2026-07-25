import { geoArea, geoMercator, geoPath, type GeoProjection } from "d3-geo";
import rawChina from "@backend/data/china-geo.json";
import { provinces } from "@backend/data/provinces";

export type { GeoProjection } from "d3-geo";

type Position = [number, number];
type Ring = Position[];

export interface GeoFeature {
  type: "Feature";
  properties: { adcode: number | string; name: string };
  geometry:
    | { type: "Polygon"; coordinates: Ring[] }
    | { type: "MultiPolygon"; coordinates: Ring[][] }
    | { type: string; coordinates: unknown };
}

const adcodeToProvinceId = new Map(provinces.map((province) => [province.adcode, province.id]));

function fixWinding(feature: GeoFeature): GeoFeature {
  if (geoArea(feature as never) <= 2 * Math.PI) return feature;

  if (feature.geometry.type === "Polygon") {
    const coordinates = feature.geometry.coordinates as Ring[];

    return {
      ...feature,
      geometry: {
        type: "Polygon",
        coordinates: coordinates.map((ring) => ring.slice().reverse()),
      },
    };
  }

  if (feature.geometry.type === "MultiPolygon") {
    const coordinates = feature.geometry.coordinates as Ring[][];

    return {
      ...feature,
      geometry: {
        type: "MultiPolygon",
        coordinates: coordinates.map((polygon) => polygon.map((ring) => ring.slice().reverse())),
      },
    };
  }

  return feature;
}

export const chinaFeatures: GeoFeature[] = (rawChina.features as GeoFeature[])
  .filter(
    (feature) =>
      adcodeToProvinceId.has(Number(feature.properties.adcode)) &&
      (feature.geometry.type === "Polygon" || feature.geometry.type === "MultiPolygon"),
  )
  .map(fixWinding);

const rawDashLine = (rawChina.features as GeoFeature[]).find(
  (feature) => String(feature.properties.adcode) === "100000_JD",
);

export const dashLineFeature: GeoFeature | null = rawDashLine ? fixWinding(rawDashLine) : null;

export const provinceIdOf = (feature: GeoFeature) =>
  adcodeToProvinceId.get(Number(feature.properties.adcode)) ?? "";

export function makeProjection(width: number, height: number, padding = 18): GeoProjection {
  return geoMercator().fitExtent(
    [
      [padding, padding],
      [width - padding, height - padding],
    ],
    { type: "FeatureCollection", features: chinaFeatures } as never,
  );
}

export function makePath(projection: GeoProjection) {
  return geoPath(projection);
}
