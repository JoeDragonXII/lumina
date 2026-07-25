import "server-only";

import { geoContains } from "d3-geo";
import { feature } from "topojson-client";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import worldData from "world-atlas/countries-50m.json";
import { cities } from "@backend/data/cities";
import { provinces } from "@backend/data/provinces";
import { chinaFeatures, provinceIdOf } from "@backend/lib/geo";
import type { LocationInput } from "@backend/modules/core/types";
import { asianCountryByNumericId } from "@backend/modules/map/data/asianCountries";

const world = worldData as { objects: { countries: object } };
const worldFeatures = (feature(worldData as never, world.objects.countries as never) as unknown as FeatureCollection).features;
const provinceById = new Map(provinces.map((province) => [province.id, province]));

function distanceKm(latitude: number, longitude: number, targetLatitude: number, targetLongitude: number) {
  const radians = (degrees: number) => (degrees * Math.PI) / 180;
  const latitudeDelta = radians(targetLatitude - latitude);
  const longitudeDelta = radians(targetLongitude - longitude);
  const a =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(radians(latitude)) * Math.cos(radians(targetLatitude)) * Math.sin(longitudeDelta / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function inferLocationFromCoordinates(latitude: number, longitude: number): LocationInput | null {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return null;

  const point: [number, number] = [longitude, latitude];
  const countryFeature = worldFeatures.find((item) => geoContains(item as Feature<Geometry>, point));
  const country = countryFeature
    ? asianCountryByNumericId.get(String(countryFeature.id).padStart(3, "0"))
    : null;
  if (!country) return null;

  const base: LocationInput = {
    countryCode: country.code,
    countryName: country.name,
    displayName: country.name,
    latitude,
    longitude,
    source: "exif",
    confirmed: false,
  };
  if (country.code !== "CN") return base;

  const provinceFeature = chinaFeatures.find((item) => geoContains(item as Feature<Geometry>, point));
  const provinceId = provinceFeature ? provinceIdOf(provinceFeature) : "";
  const province = provinceById.get(provinceId);
  if (!province) return base;

  const nearestCity = cities
    .filter((city) => city.provinceId === provinceId)
    .map((city) => ({ city, distance: distanceKm(latitude, longitude, city.lat, city.lng) }))
    .sort((left, right) => left.distance - right.distance)[0];

  return {
    ...base,
    regionCode: province.id,
    regionName: province.name,
    city: nearestCity?.city.name || null,
    displayName: [country.name, province.name, nearestCity?.city.name].filter(Boolean).join(" · "),
  };
}
