import type { CollectionInput, CollectionVisibility, LocationInput } from "@backend/modules/core/types";

const visibilities = new Set<CollectionVisibility>(["draft", "private", "public"]);

function record(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function optionalText(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function optionalNumber(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function parseLocation(value: unknown): LocationInput | null {
  const item = record(value);
  if (!item) return null;
  const countryCode = optionalText(item.countryCode);
  const countryName = optionalText(item.countryName);
  const displayName = optionalText(item.displayName);
  if (!countryCode || !countryName || !displayName) return null;

  return {
    countryCode: countryCode.toUpperCase(),
    countryName,
    regionCode: optionalText(item.regionCode),
    regionName: optionalText(item.regionName),
    city: optionalText(item.city),
    displayName,
    latitude: optionalNumber(item.latitude),
    longitude: optionalNumber(item.longitude),
    source: item.source === "exif" ? "exif" : "manual",
    confirmed: item.confirmed === true,
  };
}

export function parseCollectionInput(value: unknown): CollectionInput {
  const item = record(value);
  if (!item) throw new Error("图集数据格式无效。");
  const visibility = visibilities.has(item.visibility as CollectionVisibility)
    ? (item.visibility as CollectionVisibility)
    : "draft";

  return {
    title: typeof item.title === "string" ? item.title : "",
    slug: typeof item.slug === "string" ? item.slug : "",
    story: typeof item.story === "string" ? item.story : "",
    category: typeof item.category === "string" ? item.category : "摄影作品",
    tags: Array.isArray(item.tags) ? item.tags.filter((tag): tag is string => typeof tag === "string") : [],
    visibility,
    featured: item.featured === true,
    dateStart: optionalText(item.dateStart),
    dateEnd: optionalText(item.dateEnd),
    location: parseLocation(item.location),
    assetIds: Array.isArray(item.assetIds)
      ? item.assetIds.filter((assetId): assetId is string => typeof assetId === "string")
      : [],
    coverAssetId: optionalText(item.coverAssetId),
  };
}
