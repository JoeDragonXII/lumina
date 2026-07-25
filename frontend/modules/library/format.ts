import type { CollectionRecord } from "@backend/modules/library/types";

export function collectionCover(collection: CollectionRecord) {
  return collection.photos.find((photo) => photo.id === collection.coverAssetId) || collection.photos[0] || null;
}

export function collectionDateLabel(collection: CollectionRecord) {
  if (!collection.dateStart) return "日期待补充";
  const start = collection.dateStart.replaceAll("-", ".");
  const end = collection.dateEnd?.replaceAll("-", ".");
  return end && end !== start ? `${start} — ${end}` : start;
}

export function collectionYear(collection: CollectionRecord) {
  return (collection.dateStart || collection.createdAt).slice(0, 4);
}

export function collectionMonth(collection: CollectionRecord) {
  const value = collection.dateStart || collection.createdAt;
  return new Intl.DateTimeFormat("zh-CN", { month: "long", timeZone: "UTC" }).format(new Date(value));
}
