import "server-only";
import { and, desc, eq, isNull, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/sqlite-core';
import { getDatabase } from './database';
import { collections, locations, photoAssets } from './schema';
import { libraryRepository, toAssetRecord } from './repository';

export function listPublicCollectionSummaries(category?: string, limit?: number, offset = 0) {
  const { db } = getDatabase();
  const cover = alias(photoAssets, 'cover');
  const gps = alias(photoAssets, 'gps');
  const query = db.select({ collection: collections, location: locations, asset: cover,
    alt: sql<string>`(select cp.alt from collection_photos cp where cp.collection_id = ${collections.id} and cp.asset_id = ${cover.id})`,
    count: sql<number>`(select count(*) from collection_photos cp where cp.collection_id = ${collections.id})`,
    latitude: gps.latitude, longitude: gps.longitude,
  }).from(collections)
    .leftJoin(locations, eq(collections.locationId, locations.id))
    .leftJoin(cover, eq(cover.id, sql<string>`(select cp.asset_id from collection_photos cp where cp.collection_id = ${collections.id} order by (cp.asset_id = ${collections.coverAssetId}) desc, cp.position asc limit 1)`))
    .leftJoin(gps, eq(gps.id, sql<string>`(select p.id from collection_photos cp join photo_assets p on p.id = cp.asset_id where cp.collection_id = ${collections.id} and p.latitude between -85 and 85 and p.longitude between -180 and 180 order by (p.id = ${collections.coverAssetId}) desc, cp.position asc limit 1)`))
    .where(and(eq(collections.visibility, 'public'), isNull(collections.deletedAt), category ? eq(collections.category, category) : undefined))
    .orderBy(desc(sql`coalesce(${collections.dateStart}, ${collections.createdAt})`), desc(collections.createdAt));
  const rows = limit === undefined ? query.all() : query.limit(limit).offset(offset).all();
  return rows.map(({collection, location, asset, alt, count, latitude, longitude}) => ({
    ...collection, location, count, cover: asset ? toAssetRecord(asset, [], alt || "") : null,
    position: location?.latitude != null && location.longitude != null && Math.abs(location.latitude) <= 85 && Math.abs(location.longitude) <= 180
      ? {latitude: location.latitude, longitude: location.longitude}
      : latitude != null && longitude != null ? {latitude, longitude} : null,
  }));
}
export function publicCategoryCounts() {
  return getDatabase().db.select({ category: collections.category, count: sql<number>`count(*)` })
    .from(collections).where(and(eq(collections.visibility,'public'),isNull(collections.deletedAt)))
    .groupBy(collections.category).orderBy(collections.category).all();
}
export function getPublicMapAlbum(slug: string) {
  const collection = libraryRepository.getCollectionBySlug(slug);
  if (!collection) return null;
  const media = (id: string, variant: string) => `/api/media/${encodeURIComponent(id)}/${variant}?v=3`;
  return {id:collection.id,slug:collection.slug,title:collection.title,location:collection.location?.displayName || '',
    photos:collection.photos.map(photo=>({id:photo.id,src:media(photo.id,'display'),thumb:media(photo.id,'thumb'),width:photo.width,height:photo.height,
      title:photo.alt || collection.title,date:photo.takenAt || undefined,takenAt:photo.takenAt || undefined,position:photo.position,
      latitude:photo.latitude,longitude:photo.longitude,location:collection.location?.displayName,camera:photo.cameraModel || photo.cameraMake || undefined,lens:photo.lens || undefined,
      settings:[photo.focalLength ? `${photo.focalLength}mm`:'',photo.aperture ? `ƒ/${photo.aperture}`:'',photo.shutterSpeed || '',photo.iso ? `ISO ${photo.iso}`:''].filter(Boolean).join(' · ')
    }))};
}
