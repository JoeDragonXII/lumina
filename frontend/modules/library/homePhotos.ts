import type { CollectionRecord } from "@backend/modules/library/types";
import { seededRandom, shuffled } from "./photoWallLayout";

// Shared assets can belong to many albums. Show each image once on the home wall.
export function selectHomePhotos(collections: CollectionRecord[], limit = 12, seed?: number) {
  const seen = new Set<string>();
  const entries = [...collections].sort((a, b) => Number(b.featured) - Number(a.featured)).flatMap(collection => collection.photos.flatMap(photo => {
    if (seen.has(photo.id)) return [];
    seen.add(photo.id);
    return [{ photo, collection }];
  }));
  if (seed === undefined) return entries.slice(0, Math.max(0, limit));
  const random = seededRandom(seed);
  const selected = [
    ...shuffled(entries.filter(entry => entry.collection.featured), random),
    ...shuffled(entries.filter(entry => !entry.collection.featured), random),
  ].slice(0, Math.max(0, limit));
  return shuffled(selected, random);
}
