import type { CollectionRecord } from "@backend/modules/library/types";

function positioned(value: { latitude?: number | null; longitude?: number | null } | null | undefined): value is { latitude: number; longitude: number } {
  return typeof value?.latitude === "number" && Number.isFinite(value.latitude) && Math.abs(value.latitude) <= 85
    && typeof value.longitude === "number" && Number.isFinite(value.longitude) && Math.abs(value.longitude) <= 180;
}

// Album locations stay authoritative; photo GPS also makes an album discoverable.
export function collectionPosition(collection: CollectionRecord) {
  if (positioned(collection.location)) return { latitude: collection.location.latitude, longitude: collection.location.longitude };
  const cover = collection.photos.find(photo => photo.id === collection.coverAssetId);
  const photo = positioned(cover) ? cover : collection.photos.find(positioned);
  return photo ? { latitude: photo.latitude as number, longitude: photo.longitude as number } : null;
}
